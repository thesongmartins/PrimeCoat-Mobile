# PrimeCoat Mobile

The Android/iOS app for PrimeCoat. It uses the **same** Supabase project, Google sign-in, products, cart, orders and order API as the web shop at https://primecoatt.vercel.app. It has no backend of its own. The web app lives in a separate folder/repo, `../PrimeCoat`.

Expo SDK 57 · React Native 0.86 · Expo Router · TypeScript · Supabase · TanStack Query v5 · Supabase Realtime · Zustand (UI state only).

---

## Architecture

```
                 Supabase (Postgres + Auth + Realtime)  ← source of truth
                   │                     │
     PostgREST / RPC (RLS)        postgres_changes on cart_items
                   │                     │
     ┌─────────────┴───────┐      ┌──────┴───────────────────┐
     │ Web (Next.js)       │      │ Mobile (this app)         │
     │ server components   │      │ TanStack Query cache      │
     │ + server actions    │      │ useQuery / useMutation    │
     │ CartRealtimeSync →  │      │ useCartRealtime →         │
     │   router.refresh()  │      │   invalidate ['cart',uid] │
     └─────────────────────┘      └───────────────────────────┘
                   │
     POST /api/orders (cookie or Bearer) → create_order() → Mailgun
```

| Kind of state | Where it lives |
|---|---|
| Products, cart, orders, profile | Supabase, cached by **TanStack Query** (`queries/`, `mutations/`) |
| Session | Supabase Auth, persisted in the device keychain (`lib/secure-storage.ts`) |
| Realtime connection status ("Live" dot) | **Zustand** (`stores/sync.ts`) — the only Zustand store |
| Form input, search text, selected chip | Component state / route params |

### Folders

```
app/            Expo Router screens: login, (tabs)/{index,shop,cart,orders,account},
                product/[slug], checkout, order/[id], auth/callback
components/     PrimeCoat UI (ui/ primitives mirror components/ui on the web)
constants/      theme.ts (tokens copied from app/globals.css), Nigerian states
hooks/          useCartRealtime (Realtime → query cache), useOnline
lib/            supabase client, env, query keys, auth helpers, pure cart maths, errors
mutations/      cart (optimistic), checkout, auth
providers/      QueryProvider (QueryClient config), AuthProvider (session)
queries/        products, cart, orders, profile
stores/         sync.ts (Zustand, UI only)
types/          app types (camelCase), mirrors /types on the web
tests/          node:test unit tests for pure logic
```

### TanStack Query

- One `QueryClient` (`providers/QueryProvider.tsx`): `staleTime` 30 s, `gcTime` 10 min, queries retried twice except for permanent errors (4xx, RLS, validation), **mutations never retried** (a retried order could double-charge stock). `focusManager` follows `AppState`, `onlineManager` follows NetInfo. A 401/JWT error anywhere triggers one session refresh, then a local sign-out.
- Keys are defined once in `lib/query-keys.ts`:
  `['products','list',filters]`, `['products','featured']`, `['products','detail',slug]`, `['cart',userId]`, `['orders',userId]`, `['orders',userId,orderId]`, `['profile',userId]`.
- Signing out or switching account calls `queryClient.clear()` so no data crosses accounts.

### Cart

The mobile app reads and writes the **existing** `public.cart_items` table — the same rows the web cart shows. There is no second cart.

| Action | Call | Same as web |
|---|---|---|
| Read | `cart_items` joined to `products` + `profiles.delivery_state` | `lib/cart/queries.ts` |
| Add | `rpc('cart_add_item')` | `addToCart` server action |
| Change quantity | stock lookup → `update cart_items` | `setCartQuantity` |
| Remove | `delete cart_items where product_id` | `removeFromCart` |
| Clear | `delete cart_items where user_id` (RLS-scoped) | — (mobile only) |
| Delivery state | `update profiles.delivery_state` | `setDeliveryState` |

Every write is optimistic: cancel the cart fetch → snapshot → patch the cache → write → roll back on error (with a message) → refetch when the last pending write settles. Writes run one at a time in tap order, so quick taps on the stepper can't land out of order.

### Realtime

`hooks/useCartRealtime.ts` is mounted once (root layout) for the signed-in user:

- channel `cart:<uid>`; INSERT/UPDATE filtered with `user_id=eq.<uid>` (RLS also applies)
- a separate unfiltered DELETE listener, because **Supabase cannot filter DELETE events and sends them for every user with only `{ id }`** (verified on the live project). `lib/cart-realtime.ts` only acts when that id is one of our cached lines.
- events **invalidate** `['cart', uid]`; the cart is re-read through the normal query (a `cart_items` row has no name or price, so patching from the event would be wrong)
- bursts are debounced (200 ms); events are ignored while a local cart write is pending (its own refetch covers them)
- removed on unmount, sign-out and user change; after a dropped connection the cart is refetched once
- the cart also refetches whenever the app returns to the foreground

### Checkout

`mutations/checkout.ts` posts `{ customer }` to the web app's existing `POST /api/orders` with `Authorization: Bearer <supabase access token>`. The route reads items from the shared cart, calls `create_order()` (server pricing, stock checks, empties the cart in the same transaction) and sends the Mailgun email server-side. The app never sees Mailgun or service-role credentials.

---

## Setup

### 1. Environment

```bash
cp .env.example .env
```

Fill in (public values only — the same ones the web uses as `NEXT_PUBLIC_*`):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
EXPO_PUBLIC_SITE_URL=https://primecoatt.vercel.app
```

`EXPO_PUBLIC_SITE_URL` is where product images and `POST /api/orders` are fetched from. To use a local web dev server instead: `http://10.0.2.2:3000` from the Android emulator, or `http://<your-computer's-LAN-IP>:3000` from a phone on the same Wi-Fi.

### 2. Supabase (one-time, manual)

Supabase Dashboard → your PrimeCoat project → **Authentication → URL Configuration → Redirect URLs** → **Add URL**:

```
primecoat://auth/callback
```

Save. Without this, Supabase sends Google sign-in back to the website instead of the app.

Realtime is enabled by the migration `supabase/migrations/20261004130000_cart_realtime.sql` in the web repo (already applied to the live project). To check: Dashboard → Database → Publications → `supabase_realtime` lists `cart_items`.

### 3. Google Cloud

Nothing to change. Google still redirects to `https://<ref>.supabase.co/auth/v1/callback`, which is already authorised. If the OAuth consent screen is in *Testing*, the Google account you demo with must be in its **Test users** list (same as for the web).

### 4. Web deployment

The Bearer-token support in `POST /api/orders` is part of this change. **Redeploy the web app** (push to the branch Vercel deploys, or `vercel --prod`) before placing orders from the app against production. Until then, use a local web dev server for checkout (see step 1).

### 5. Install

```bash
npm install
```

---

## Running

Google sign-in uses the `primecoat://` scheme, which **Expo Go cannot register**. Use a development build or the release APK.

### Android emulator or USB-connected phone (development build)

Requires Android Studio (SDK + its bundled JDK).

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"   # macOS
export ANDROID_HOME="$HOME/Library/Android/sdk"
# Android Studio now bundles JDK 25. Its native-access warning makes the CMake/prefab step fail;
# this flag silences it. (With JDK 17 — React Native's reference JDK — it is not needed.)
export JAVA_TOOL_OPTIONS="--enable-native-access=ALL-UNNAMED"
npx expo run:android            # builds, installs and starts Metro
```

The first build downloads the NDK, CMake and a few hundred MB of Gradle dependencies; on a slow connection that can take 30+ minutes with little output. Later builds take 1–4 minutes.

Physical phone: enable **Developer options → USB debugging**, connect by USB, accept the prompt, check `adb devices` lists it, then run the command above. Phone and computer must be on the same Wi-Fi for Metro (or run `adb reverse tcp:8081 tcp:8081`).

### Standalone APK for a physical phone (no computer needed after install)

```bash
npx expo prebuild --platform android
cd android && JAVA_TOOL_OPTIONS="--enable-native-access=ALL-UNNAMED" ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
adb install -r app/build/outputs/apk/release/app-release.apk     # or copy the file to the phone
```

The release APK is signed with the debug keystore that prebuild generates — fine for sideloading and demos, not for the Play Store. For a store build use EAS: `npx eas-cli@latest build -p android --profile preview`.

---

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm test            # node:test unit tests (realtime event filter, totals, formatting)
npm run doctor      # expo-doctor
```

---

## Test checklist

See `../PrimeCoat/CONTEXT.md` (Session 9) for what has been run and its results. A prebuilt release APK from that session is in `dist/primecoat-release.apk` (git-ignored). The demo:

1. Laptop: web → Sign in with Google → add a paint (× 1).
2. Phone: PrimeCoat app → Continue with Google (same account) → Cart shows the paint × 1.
3. Laptop: change quantity to 2 → the phone updates to 2 with no refresh.
4. Phone: add a primer → it appears in the laptop's cart with no refresh.
5. Phone: checkout → order confirmation → order appears under Orders on the web.

---

## Known issues and limits

- **Online-first, not offline-capable.** Cached screens stay visible offline and cart writes wait (the cart shows "Waiting for connection"); checkout is disabled offline. Nothing is queued across app restarts.
- Google sign-in needs a development or release build (custom scheme), not Expo Go.
- Product images are SVGs served by the web app, so `EXPO_PUBLIC_SITE_URL` must be reachable from the phone.
- The release APK is debug-signed (see above).
- Account creation and password reset are on the web; the app signs in with Google or an existing email account.
