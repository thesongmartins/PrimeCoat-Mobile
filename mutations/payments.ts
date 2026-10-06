import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { AppError } from "@/lib/errors";
import { postToSite } from "@/lib/site-api";
import { queryKeys } from "@/lib/query-keys";
import { PAYMENT_RETURN_URL, parsePaymentReturn, type PaymentReturn } from "@/lib/payment-return";
import { useUserId } from "@/providers/AuthProvider";

/**
 * Shows the order with its payment outcome on top of the tabs. Idempotent: on Android the return
 * link reaches both openAuthSessionAsync and the router (app/payment-result.tsx), so this can run
 * twice and must land on the same screen either way.
 */
export function showPaymentResult({ orderId, status }: PaymentReturn) {
  if (router.canDismiss()) router.dismissAll();
  router.navigate("/orders");
  if (orderId) router.push({ pathname: "/order/[id]", params: { id: orderId, payment: status } });
}

/**
 * Opens Paystack's hosted checkout in the in-app browser. The website verifies the payment with
 * Paystack before sending the browser back to primecoat://payment-result, so by the time we're
 * back the order row already says whether it's paid.
 */
export function usePaystackCheckout() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return async (orderId: string, paymentUrl: string) => {
    let back: PaymentReturn | null = null;
    try {
      const result = await WebBrowser.openAuthSessionAsync(paymentUrl, PAYMENT_RETURN_URL);
      if (result.type === "success") back = parsePaymentReturn(result.url);
    } catch {
      // The browser couldn't open; fall through to the order, where Pay now can retry.
    }
    // Closed without coming back: the order is saved and unpaid unless Paystack says otherwise.
    await queryClient.invalidateQueries({ queryKey: queryKeys.orders.all(userId) });
    showPaymentResult({ orderId: back?.orderId ?? orderId, status: back?.status ?? "cancelled" });
  };
}

/** Pay now for an unpaid card order — POST /api/orders/:id/pay, same as the web's PayNowButton. */
export function usePayNow() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  const openPaystack = usePaystackCheckout();

  return useMutation({
    mutationKey: ["payments", "payNow"],
    retry: 0,
    mutationFn: async (orderId: string) => {
      const { paymentUrl } = await postToSite<{ paymentUrl?: string }>(`/api/orders/${orderId}/pay`, {}, {
        offline: "We couldn't reach PrimeCoat. Check your connection and try again.",
        failed: "We couldn't start the payment. Please try again.",
      });
      if (!paymentUrl) throw new AppError("We couldn't start the payment. Please try again.", "BAD_RESPONSE", 502);
      await openPaystack(orderId, paymentUrl);
    },
    onError: (error) => {
      // e.g. ALREADY_PAID: an earlier attempt went through. Show the real state.
      if (error instanceof AppError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all(userId) });
      }
    },
  });
}
