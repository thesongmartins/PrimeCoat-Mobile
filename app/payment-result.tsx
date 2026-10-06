import { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toPaymentOutcome } from "@/lib/payment-return";
import { showPaymentResult } from "@/mutations/payments";
import { useUserId } from "@/providers/AuthProvider";
import { LoadingView } from "@/components/ui/StatusViews";

/**
 * primecoat://payment-result — where the website sends the browser after Paystack. Android opens
 * this route as well as returning the URL to openAuthSessionAsync; both end in showPaymentResult().
 */
export default function PaymentResult() {
  const { orderId, status } = useLocalSearchParams<{ orderId?: string; status?: string }>();
  const queryClient = useQueryClient();
  const userId = useUserId();

  useEffect(() => {
    void queryClient
      .invalidateQueries({ queryKey: queryKeys.orders.all(userId) })
      .finally(() => showPaymentResult({ orderId: orderId ?? null, status: toPaymentOutcome(status) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, status]);

  return <LoadingView label="Checking your payment…" />;
}
