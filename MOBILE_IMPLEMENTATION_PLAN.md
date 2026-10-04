# PrimeCoat Mobile — Implementation Plan

Written after inspecting the repository and the live Supabase project (`ddvpwizhnsorvqpizgog`) on 4 October 2026. Where the original brief assumed something the code does not do, this plan follows the code.

---

## 1. Existing architecture

| Layer | What exists |
|---|---|
| Web | Next.js 16.3 App Router, React 19, TypeScript strict, Tailwind v4, pnpm. Deployed at https://primecoatt.vercel.app |
| Rendering | Server Components read Supabase directly; client components only for interactivity |
| Mutations | Next **server actions** (`app/cart/actions.ts`) + `revalidatePath("/", "layout")` |
| Database | Supabase Postgres with RLS on every table |
| Email | Mailgun HTTP API, server-side only (`lib/mailgun/`), called from `POST /api/orders` after the order commits |
| State libraries | **None.** Zustand was removed in Session 7 when the cart moved to Supabase. There is no TanStack Query on the web. |

## 2. Existing authentication

- Supabase Auth, Google OAuth (PKCE) + email/password.
- Web: `@supabase/ssr` cookie sessions. `GoogleSignInButton` → `signInWithOAuth({ redirectTo: <origin>/auth/callback })` → `app/auth/callback/route.ts` exchanges the code.
- `proxy.ts` refreshes the session and guards `/checkout`, `/orders`, `/account`.
- `handle_new_user` trigger on `auth.users` creates the `profiles` row.
- The same Supabase user id is used for every table, so a second client signing in with the same Google account sees the same data automatically.

## 3. Existing backend / API

| Route | Purpose | Auth |
|---|---|---|
| `POST /api/orders` | Validates `{ customer }` with Zod, reads items **from the DB cart**, calls `create_order()`, sends Mailgun email, records email status | Cookie session only (via `getCurrentUser()` and `lib/supabase/server.ts`) |
| `POST /api/service-requests` | Painting service leads | Optional |
| `GET /auth/callback`, `GET /auth/confirm` | OAuth code exchange, email OTP links | — |

Everything else (products, cart, orders, profile) is read directly from Supabase under RLS.

## 4. Existing cart architecture

- Table `public.cart_items` — **already persistent; not migrated again.**
- Reads: `lib/cart/queries.ts` → `cart_items` joined to `products` (price always from the current product row), plus `profiles.delivery_state`.
- Add: RPC `cart_add_item(p_product_id, p_quantity)` — atomic upsert, increments existing line, clamps to stock and 999, `security invoker` (RLS applies).
- Change quantity: `update cart_items set quantity = capped where product_id = …` (RLS scopes to owner).
- Remove: `delete from cart_items where product_id = …`.
- Clear: only inside `create_order()` (same transaction as the order).
- Ownership: `user_id default auth.uid()` + RLS `auth.uid() = user_id` on select/insert/update/delete.
- **Realtime: not enabled.** Verified on the live DB: `pg_publication_tables` for `supabase_realtime` is empty. No web subscription exists.

## 5. Existing database schema (relevant tables)

```
profiles     (id → auth.users, full_name, email, avatar_url, phone, delivery_state, …)
products     (id, slug, name, description, short_description, category, price, image_url,
              size, colour_name, colour_hex, finish, coverage, stock_quantity, is_active, is_featured, …)
cart_items   (id, user_id → auth.users, product_id → products, quantity 1..999,
              unique(user_id, product_id), created_at, updated_at)
orders       (id, user_id, order_number PC-YYYYMMDD-NNNN, customer fields, subtotal, delivery_fee,
              total, status, payment_method, payment_status, confirmation_email_status, …)
order_items  (id, order_id, product_id, product_name, product_image_url, unit_price, quantity, subtotal)
```

`products.image_url` is a **relative path** (`/images/products/<slug>.svg`) served by the web app. Mobile prefixes it with the web origin and renders SVG via `expo-image`.

## 6. Existing order architecture

`create_order(p_customer jsonb, p_items jsonb)` — SECURITY DEFINER, requires `auth.uid()`, prices every line from `products`, locks rows, checks stock, computes delivery fee (`calculate_delivery_fee`), generates the order number, inserts order + items, **deletes the buyer's cart rows and saves `delivery_state` in the same transaction**. `POST /api/orders` wraps it and sends the Mailgun email.

## 7. Existing design system

From `app/globals.css` and `components/ui/*`:

- Colours: charcoal `#1B1B1F`, ink `#121214`, warm-white `#FAF8F5`, cream `#F3EFE8`, stone `#E8E3DC`, terracotta `#C65D3B` (700 `#A84A2C`, 100 `#F6E4DC`), sage `#7D8F7A`, ochre `#D9A441`, mute `#6B665F`, success `#3F7D4E`, danger `#B23A3A`.
- Type: Fraunces (display, headings, prices) + Inter (body). Eyebrow labels: 11 px, semibold, uppercase, 0.18em tracking, terracotta.
- Radii max 8 px (pills excepted). Soft card shadow. No gradients, no glassmorphism.
- Buttons: primary charcoal, accent terracotta, outline charcoal border; heights 36/44/48.
- Badges: rounded-full tinted pills (stock and order status tones).
- Logo: charcoal square with a warm-white "P" and terracotta counter.
- Empty states: dashed stone border on cream, terracotta icon, Fraunces title.
- Icons: `lucide` (web uses `lucide-react`; mobile uses `lucide-react-native`).

## 8. TanStack Query architecture (mobile)

```
providers/QueryProvider.tsx   QueryClient (staleTime 30 s, gcTime 10 min, retry 2 for queries /
                              0 for mutations, no retry on 4xx/RLS errors), focusManager ← AppState,
                              onlineManager ← NetInfo
lib/queryKeys.ts              single source for every key
queries/products.ts           useProducts(filters), useProduct(slug), useFeaturedProducts()
queries/cart.ts               useCart(userId) → { items, deliveryState }
queries/orders.ts             useOrders(userId), useOrder(userId, orderId)
queries/profile.ts            useProfile(userId)
mutations/cart.ts             useAddToCart, useSetCartQuantity, useRemoveFromCart, useClearCart,
                              useSetDeliveryState — optimistic, with rollback + invalidate on settle
mutations/checkout.ts         usePlaceOrder → POST /api/orders (Bearer token)
mutations/auth.ts             useGoogleSignIn, useEmailSignIn, useSignOut
```

Query keys:

```
['products', 'list', filters]   ['products', 'detail', slug]   ['products', 'featured']
['cart', userId]                ['orders', userId]             ['orders', userId, orderId]
['profile', userId]
```

Optimistic cart flow: `cancelQueries(['cart', uid])` → snapshot → `setQueryData` → mutate → on error restore snapshot and surface the message → `onSettled` invalidate. Mutations share a `mutationKey: ['cart']` scope so the UI can show "Syncing…" via `useIsMutating`.

## 9. Mobile architecture

Expo SDK 57, React Native 0.86, Expo Router (file-based), TypeScript strict. Lives in its own folder and git repo, `PrimeCoat-mobile/`, next to the web repo `PrimeCoat/`, with its own `package.json` (npm). It shares no code with the web app.

```
app/
  _layout.tsx                 fonts, splash, providers, auth gate
  index.tsx                   splash/redirect
  (auth)/login.tsx            Google + email sign-in
  (tabs)/_layout.tsx          Home · Shop · Cart · Orders · Account
  (tabs)/index.tsx  shop.tsx  cart.tsx  orders/index.tsx  account.tsx
  product/[slug].tsx          product detail
  checkout.tsx                checkout form
  order/[id].tsx              order detail / confirmation
```

Zustand: one small store, `stores/sync.ts`, for **local UI state only** — the Realtime connection status shown as a "Live" indicator. No products, cart, orders or profile data live in Zustand.

## 10. Realtime architecture

```
web/mobile mutation → Postgres cart_items → supabase_realtime publication
      → postgres_changes (filter user_id=eq.<uid>) → client
      → web:    router.refresh()                     (server components re-read the DB)
      → mobile: queryClient.invalidateQueries(['cart', uid])  (TanStack refetch)
```

- **Invalidate, don't patch.** A `cart_items` row has no price/name; the cart view is a join. Refetching is the only way to stay correct.
- Mobile: `hooks/useCartRealtime.ts`, mounted once in the authenticated layout. One channel `cart:<uid>`; listeners for INSERT/UPDATE (filtered on `user_id`) and DELETE (delete events carry only the primary key under RLS, so the handler checks the id against the cached cart before invalidating). Invalidations are debounced (150 ms) so a burst of events — e.g. `create_order` deleting several rows — triggers one refetch. Mutations in flight are not overwritten: realtime invalidation is skipped while a local cart mutation is pending (its own `onSettled` refetches).
- Channel is removed on unmount, sign-out and user change (effect keyed on `userId`). On reconnect (`SUBSCRIBED` after `CHANNEL_ERROR`/`TIMED_OUT`) the cart is invalidated once to catch missed events. App foreground → TanStack `focusManager` refetches.
- Web: `components/cart/cart-realtime-sync.tsx` (client), rendered by the header only when a user is signed in. Same channel shape; on events it calls `router.refresh()` (debounced). No new state library on the web; the server-rendered cart stays the source of truth there.

## 11. Required database changes

One additive migration, in the web repo: `supabase/migrations/20261004130000_cart_realtime.sql`

```sql
alter publication supabase_realtime add table public.cart_items;
```

No schema, column or policy change. RLS still decides which INSERT/UPDATE events a subscriber receives.

## 12. Required Supabase configuration (manual)

Authentication → URL Configuration → Redirect URLs: add

- `primecoat://auth/callback` (development build / APK)
- `exp://**` (only if you also want to try Expo Go; Google sign-in needs the dev build)

Nothing else: same project, same anon key, same Google provider.

## 13. Required Google OAuth configuration

None. Mobile uses Supabase's OAuth flow in the system browser (`expo-web-browser` auth session). Google still redirects to `https://<ref>.supabase.co/auth/v1/callback`, which is already authorised in Google Cloud. Supabase then redirects to `primecoat://auth/callback?code=…`, and the app exchanges the code (PKCE). Same Google account → same Supabase user id.

## 14. Required Expo configuration

`app.json`: name **PrimeCoat**, slug `primecoat`, scheme `primecoat`, Android package `ng.primecoat.app`, icon/adaptive icon/splash generated from the PrimeCoat logo mark, `expo-router`, `expo-secure-store`, `expo-splash-screen`, `expo-font`, `expo-web-browser` plugins.

`.env` (git-ignored, public values only):

```
EXPO_PUBLIC_SUPABASE_URL=…
EXPO_PUBLIC_SUPABASE_ANON_KEY=…
EXPO_PUBLIC_SITE_URL=https://primecoatt.vercel.app   # images + POST /api/orders
```

### Web change needed for checkout

`POST /api/orders` only understands cookie sessions. A native app has no cookies, so the route must also accept `Authorization: Bearer <supabase access token>`. Change: `lib/supabase/server.ts` creates a header-authenticated client when a Bearer token is present, and `getCurrentUser()` validates that token with `auth.getUser(token)`. RLS, `create_order()`, pricing and Mailgun are untouched. **The web app must be redeployed to Vercel** before mobile checkout works against production.

## 15. Testing strategy

| Layer | How |
|---|---|
| Web regression | `pnpm typecheck && pnpm lint && pnpm test && pnpm build`; new Vitest tests for Bearer-token auth in `/api/orders` |
| Mobile static | `npx tsc --noEmit`, `npx expo-doctor` |
| Mobile unit | pure helpers (cart totals, image URL, realtime event filter) with Jest via `jest-expo` |
| Realtime | Node script with two throwaway users: subscribe as A, mutate as A (event arrives), mutate as B (no event for A); then deleted |
| Device | Android emulator + physical phone: login, products, add/update/remove, web↔mobile sync, checkout, orders |

The full manual checklist from the brief is tracked in `README.md` → *Test checklist*, with results recorded in `../PrimeCoat/CONTEXT.md`.
