import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppError } from "@/lib/errors";
import { postToSite } from "@/lib/site-api";
import { queryKeys } from "@/lib/query-keys";
import { useUserId } from "@/providers/AuthProvider";
import type { CheckoutInput } from "@/lib/checkout-schema";
import type { Cart } from "@/types/cart";

export interface PlaceOrderResult {
  orderId: string;
  orderNumber: string;
  /** Pay on delivery: whether the confirmation email went out. */
  emailStatus?: "sent" | "failed";
  /** Card: Paystack's hosted checkout. The confirmation email is sent once payment is verified. */
  paymentUrl?: string;
  /** Card: the order was saved but Paystack couldn't be reached; pay from the order screen. */
  paymentError?: string;
}

/**
 * Places the order through the web app's existing POST /api/orders — the same route the web
 * checkout uses. It reads items from the shared Supabase cart, calls create_order() (server
 * pricing, stock checks, cart emptied in the same transaction) and sends the Mailgun email
 * server-side (pay on delivery). Card orders come back with a Paystack paymentUrl instead.
 * The app authenticates with its Supabase access token (Bearer).
 */
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationKey: ["checkout"],
    // Never retried automatically: a retry after a lost response could place a second order.
    retry: 0,
    mutationFn: async (customer: CheckoutInput): Promise<PlaceOrderResult> => {
      const json = await postToSite<Partial<PlaceOrderResult>>("/api/orders", { customer }, {
        offline: "We couldn't reach PrimeCoat. Check your connection — your order was not placed.",
        failed: "We couldn't place your order right now. Please try again.",
      });
      if (!json.orderId || !json.orderNumber) throw new AppError("The order response was incomplete. Check Orders before trying again.", "BAD_RESPONSE", 502);
      return {
        orderId: json.orderId,
        orderNumber: json.orderNumber,
        emailStatus: json.emailStatus,
        paymentUrl: json.paymentUrl,
        paymentError: json.paymentError,
      };
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
