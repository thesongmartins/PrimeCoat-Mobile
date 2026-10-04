import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { useUserId } from "@/providers/AuthProvider";
import type { CheckoutInput } from "@/lib/checkout-schema";
import type { Cart } from "@/types/cart";

export interface PlaceOrderResult {
  orderId: string;
  orderNumber: string;
  emailStatus: "sent" | "failed";
}

/**
 * Places the order through the web app's existing POST /api/orders — the same route the web
 * checkout uses. It reads items from the shared Supabase cart, calls create_order() (server
 * pricing, stock checks, cart emptied in the same transaction) and sends the Mailgun email
 * server-side. The app authenticates with its Supabase access token (Bearer).
 */
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationKey: ["checkout"],
    // Never retried automatically: a retry after a lost response could place a second order.
    retry: 0,
    mutationFn: async (customer: CheckoutInput): Promise<PlaceOrderResult> => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new AppError("Your session has expired. Please sign in again.", "AUTH_REQUIRED", 401);

      let res: Response;
      try {
        res = await fetch(`${env.siteUrl}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ customer }),
        });
      } catch {
        throw new AppError("We couldn't reach PrimeCoat. Check your connection — your order was not placed.", "NETWORK");
      }

      const json = (await res.json().catch(() => ({}))) as Partial<PlaceOrderResult> & { error?: string; code?: string };
      if (!res.ok) {
        const fallback = res.status >= 500 ? "We couldn't place your order right now. Please try again." : "Please check your order and try again.";
        throw new AppError(json.error ?? fallback, json.code ?? `HTTP_${res.status}`, res.status);
      }
      if (!json.orderId || !json.orderNumber) throw new AppError("The order response was incomplete. Check Orders before trying again.", "BAD_RESPONSE", 502);
      return { orderId: json.orderId, orderNumber: json.orderNumber, emailStatus: json.emailStatus ?? "failed" };
    },
    onSuccess: () => {
      // create_order() emptied the shared cart in the same transaction.
      queryClient.setQueryData<Cart>(queryKeys.cart(userId), (prev) => (prev ? { ...prev, lines: [] } : prev));
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart(userId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all(userId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
      // Stock changed.
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: (error) => {
      // Stock or availability changed underneath us: show the real cart again.
      if (error instanceof AppError && (error.status === 409 || error.code === "CART_EMPTY")) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.cart(userId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      }
    },
  });
}
