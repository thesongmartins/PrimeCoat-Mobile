import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { AppError } from "@/lib/errors";
import { CART_MUTATION_KEY, queryKeys } from "@/lib/query-keys";
import { clampQuantity } from "@/lib/cart-calculations";
import { useUserId } from "@/providers/AuthProvider";
import type { Cart } from "@/types/cart";
import type { Product } from "@/types/product";

/**
 * Cart writes go straight to the existing cart_items table / cart_add_item() RPC under RLS —
 * exactly what the web's server actions do (app/cart/actions.ts). No second cart exists.
 *
 * Every mutation is optimistic:
 *   cancel in-flight cart fetch → snapshot → patch cache → write → rollback on error →
 *   refetch when the last pending cart write settles.
 *
 * Writes are sent one at a time, in the order the user made them, so quick taps on the
 * quantity stepper can't land out of order. The UI still updates instantly.
 */
let writeQueue: Promise<unknown> = Promise.resolve();
function enqueueWrite<T>(write: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(write, write);
  writeQueue = next.catch(() => undefined);
  return next;
}

function cartError(message: string | undefined): AppError {
  const m = message ?? "";
  if (m.startsWith("OUT_OF_STOCK")) return new AppError("This product is out of stock.", "OUT_OF_STOCK", 409);
  if (m.startsWith("PRODUCT_UNAVAILABLE")) return new AppError("This product is no longer available.", "PRODUCT_UNAVAILABLE", 409);
  if (m.startsWith("AUTH_REQUIRED")) return new AppError("Please sign in again.", "AUTH_REQUIRED", 401);
  if (/network|fetch/i.test(m)) return new AppError("You appear to be offline. Your cart wasn't changed.", "NETWORK");
  return new AppError("We couldn't update your cart. Please try again.", "UNKNOWN");
}

function useOptimisticCartMutation<TVars, TResult = unknown>(options: {
  write: (vars: TVars, userId: string) => Promise<TResult>;
  patch: (cart: Cart, vars: TVars) => Cart;
}) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  const key = queryKeys.cart(userId);

  return useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: (vars: TVars) => enqueueWrite(() => options.write(vars, userId)),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Cart>(key);
      if (previous) queryClient.setQueryData<Cart>(key, options.patch(previous, vars));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      // Only the last pending write refetches; earlier ones would overwrite newer optimistic state.
      if (queryClient.isMutating({ mutationKey: CART_MUTATION_KEY }) === 1) {
        return queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export function useAddToCart() {
  return useOptimisticCartMutation<{ product: Product; quantity?: number }, number>({
    write: async ({ product, quantity = 1 }) => {
      const { data, error } = await supabase.rpc("cart_add_item", { p_product_id: product.id, p_quantity: quantity });
      if (error) throw cartError(error.message);
      return data as number;
    },
    patch: (cart, { product, quantity = 1 }) => {
      const existing = cart.lines.find((l) => l.productId === product.id);
      if (existing) {
        return {
          ...cart,
          lines: cart.lines.map((l) =>
            l.productId === product.id ? { ...l, quantity: clampQuantity(l.quantity + quantity, product.stockQuantity) } : l,
          ),
        };
      }
      return {
        ...cart,
        lines: [
          ...cart.lines,
          {
            lineId: `pending:${product.id}`,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            size: product.size,
            colourName: product.colourName,
            colourHex: product.colourHex,
            stockQuantity: product.stockQuantity,
            quantity: clampQuantity(quantity, product.stockQuantity),
          },
        ],
      };
    },
  });
}

export function useSetCartQuantity() {
  return useOptimisticCartMutation<{ productId: string; quantity: number; stockQuantity: number }>({
    // Same as setCartQuantity() on the web: cap to live stock, then update the owner's row.
    write: async ({ productId, quantity }) => {
      const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", productId).maybeSingle();
      const capped = clampQuantity(quantity, (product?.stock_quantity as number | undefined) ?? quantity);
      const { error } = await supabase.from("cart_items").update({ quantity: capped }).eq("product_id", productId);
      if (error) throw cartError(error.message);
    },
    patch: (cart, { productId, quantity, stockQuantity }) => ({
      ...cart,
      lines: cart.lines.map((l) => (l.productId === productId ? { ...l, quantity: clampQuantity(quantity, stockQuantity) } : l)),
    }),
  });
}

export function useRemoveFromCart() {
  return useOptimisticCartMutation<{ productId: string }>({
    write: async ({ productId }) => {
      const { error } = await supabase.from("cart_items").delete().eq("product_id", productId);
      if (error) throw cartError(error.message);
    },
    patch: (cart, { productId }) => ({ ...cart, lines: cart.lines.filter((l) => l.productId !== productId) }),
  });
}

export function useClearCart() {
  return useOptimisticCartMutation<void>({
    write: async (_vars, userId) => {
      // RLS already limits this to the caller's rows; the WHERE also satisfies Supabase's safeupdate guard.
      const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
      if (error) throw cartError(error.message);
    },
    patch: (cart) => ({ ...cart, lines: [] }),
  });
}

/** profiles.delivery_state — the same value the web cart's "Deliver to" select writes. */
export function useSetDeliveryState() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useOptimisticCartMutation<{ state: string }>({
    write: async ({ state }, uid) => {
      const { error } = await supabase.from("profiles").update({ delivery_state: state }).eq("id", uid);
      if (error) throw cartError(error.message);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    },
    patch: (cart, { state }) => ({ ...cart, deliveryState: state }),
  });
}
