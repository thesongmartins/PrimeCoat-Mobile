import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { CircleAlert, CircleCheck, Clock, CreditCard, ShieldCheck } from "lucide-react-native";
import { colors, radii } from "@/constants/theme";
import { useUserId } from "@/providers/AuthProvider";
import { useOrder } from "@/queries/orders";
import { formatDate, formatNaira } from "@/lib/format";
import { toUserMessage } from "@/lib/errors";
import { toPaymentOutcome } from "@/lib/payment-return";
import { usePayNow } from "@/mutations/payments";
import { PAYMENT_METHOD_LABELS, isAwaitingPayment, type Order } from "@/types/order";
import { ProductImage } from "@/components/ProductImage";
import { AppText } from "@/components/ui/AppText";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView, InlineError, LoadingView } from "@/components/ui/StatusViews";

/**
 * Order detail; doubles as the confirmation screen right after checkout (?placed=1) and after
 * Paystack (?payment=success|pending|failed|cancelled). Paid or not always comes from the order row.
 */
export default function OrderScreen() {
  const { id, placed, email, payment } = useLocalSearchParams<{ id: string; placed?: string; email?: string; payment?: string }>();
  const userId = useUserId();
  const order = useOrder(userId, id ?? "");
  const justPlaced = placed === "1";
  const afterPayment = payment !== undefined;

  if (order.isPending) return <LoadingView label="Loading order…" />;
  if (order.isError) return <ErrorView error={order.error} onRetry={() => order.refetch()} />;
  if (!order.data) {
    return (
      <View style={{ padding: 20 }}>
        <EmptyState title="Order not found" description="It may belong to a different account." action={<Button onPress={() => router.navigate("/orders")}>Your orders</Button>} />
      </View>
    );
  }

  const o = order.data;
  const awaitingCard = isAwaitingPayment(o);
  const paidByCard = o.paymentMethod === "card" && o.paymentStatus === "paid";
  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={order.isRefetching} onRefresh={() => order.refetch()} tintColor={colors.terracotta} />}
    >
      <Stack.Screen options={{ title: justPlaced ? "Order confirmed" : o.orderNumber, headerBackVisible: !justPlaced }} />

      {awaitingCard && <AwaitingPayment order={o} outcome={afterPayment ? toPaymentOutcome(payment) : null} />}

      {paidByCard && afterPayment && (
        <View style={styles.success}>
          <CircleCheck size={28} color={colors.success} />
          <AppText variant="title" style={{ marginTop: 10, fontSize: 24 }}>Payment successful</AppText>
          <AppText variant="body" style={{ marginTop: 6 }}>
            {`Order ${o.orderNumber} is paid. We will call ${o.phone} to arrange delivery. `}
            {o.confirmationEmailStatus === "failed"
              ? "We couldn’t email your receipt just now; this screen is your receipt."
              : `A confirmation email is on its way to ${o.email}.`}
          </AppText>
        </View>
      )}

      {justPlaced && (
        <View style={styles.success}>
          <CircleCheck size={28} color={colors.success} />
          <AppText variant="title" style={{ marginTop: 10, fontSize: 24 }}>Thank you — your order is in.</AppText>
          <AppText variant="body" style={{ marginTop: 6 }}>
            {email === "sent" ? `A confirmation email is on its way to ${o.email}.` : "We've saved your order. The confirmation email could not be sent right now."}
          </AppText>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.head}>
          <View>
            <AppText variant="label">Order number</AppText>
            <AppText variant="heading" style={{ marginTop: 4 }}>{o.orderNumber}</AppText>
          </View>
          <OrderStatusBadge status={o.status} awaitingPayment={awaitingCard} />
        </View>
        <AppText variant="small" style={{ marginTop: 6 }}>
          Placed {formatDate(o.createdAt)} · {PAYMENT_METHOD_LABELS[o.paymentMethod]}
          {o.paymentStatus === "paid" ? " · Paid" : ""}
        </AppText>
      </View>

      {paidByCard && (
        <View style={styles.receipt}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <ShieldCheck size={20} color={colors.success} />
            <AppText variant="bodyMedium" style={{ flex: 1, color: colors.success }}>
              {formatNaira(o.receipt?.amount ?? o.total)} paid securely with Paystack
            </AppText>
          </View>
          <View style={{ marginTop: 12, gap: 8 }}>
            <Row label="Paid with" value={o.receipt?.channel ? capitalise(o.receipt.channel.replace(/_/g, " ")) : "Card"} />
            {o.receipt?.paidAt ? <Row label="Paid on" value={formatDate(o.receipt.paidAt)} /> : null}
            {o.receipt ? (
              <View>
                <AppText variant="small" style={{ fontSize: 14 }}>Payment reference</AppText>
                <AppText variant="bodyMedium" style={{ fontSize: 13, marginTop: 2 }} selectable>{o.receipt.reference}</AppText>
              </View>
            ) : null}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <AppText variant="heading">Items</AppText>
        {o.items.map((i) => (
          <View key={i.id} style={styles.item}>
            <View style={{ width: 56 }}><ProductImage uri={i.productImageUrl} radius={6} /></View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium" numberOfLines={2}>{i.productName}</AppText>
              <AppText variant="small">{i.quantity} × {formatNaira(i.unitPrice)}</AppText>
            </View>
            <AppText variant="bodyMedium">{formatNaira(i.subtotal)}</AppText>
          </View>
        ))}
        <View style={styles.totals}>
          <Row label="Subtotal" value={formatNaira(o.subtotal)} />
          <Row label={`Delivery · ${o.state}`} value={o.deliveryFee === 0 ? "Free" : formatNaira(o.deliveryFee)} />
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.stone, paddingTop: 10 }]}>
            <AppText variant="bodyMedium">Total</AppText>
            <AppText variant="price" style={{ fontSize: 20 }}>{formatNaira(o.total)}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <AppText variant="heading">Delivery</AppText>
        <AppText variant="body" style={{ marginTop: 8 }}>
          {o.customerName}{"\n"}{o.deliveryAddress}{"\n"}{o.city}, {o.state}{"\n"}{o.phone}
        </AppText>
        {o.deliveryInstructions ? <AppText variant="small" style={{ marginTop: 8 }}>“{o.deliveryInstructions}”</AppText> : null}
      </View>

      {(justPlaced || afterPayment) && (
        <View style={{ gap: 10 }}>
          <Button size="lg" onPress={() => router.replace("/orders")}>View all orders</Button>
          <Button variant="outline" size="lg" onPress={() => router.replace("/shop")}>Continue shopping</Button>
        </View>
      )}
    </ScrollView>
  );
}

const AWAITING_MESSAGES = {
  pending: "Paystack is still processing your payment. This order will show as paid once it’s confirmed — pull down to refresh in a moment.",
  cancelled: "You left the payment page before paying. Your order is saved, so you can pay whenever you’re ready.",
  failed: "The payment didn’t go through. No money was taken. Your order is saved, so you can try again.",
} as const;

/** Unpaid card order: why, and Pay now (same wording as the web confirmation page). */
function AwaitingPayment({ order, outcome }: { order: Order; outcome: ReturnType<typeof toPaymentOutcome> | null }) {
  const payNow = usePayNow();
  const pending = outcome === "pending";
  const message =
    outcome && outcome !== "success"
      ? AWAITING_MESSAGES[outcome]
      : `This order is waiting for payment of ${formatNaira(order.total)}. Pay now to confirm it.`;
  return (
    <View style={styles.awaiting}>
      {pending ? <Clock size={26} color={colors.ochreText} /> : <CircleAlert size={26} color={colors.ochreText} />}
      <AppText variant="heading" style={{ marginTop: 10 }}>Your order is waiting for payment</AppText>
      <AppText variant="body" style={{ marginTop: 6 }} accessibilityLiveRegion="polite">{message}</AppText>
      <Button
        variant="accent"
        size="lg"
        onPress={() => payNow.mutate(order.id)}
        loading={payNow.isPending}
        icon={payNow.isPending ? undefined : <CreditCard size={18} color={colors.warmWhite} />}
        style={{ marginTop: 14 }}
      >
        {payNow.isPending ? "Opening secure payment…" : `Pay ${formatNaira(order.total)} now`}
      </Button>
      {payNow.error ? (
        <View style={{ marginTop: 10 }}>
          <InlineError message={toUserMessage(payNow.error)} />
        </View>
      ) : null}
    </View>
  );
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="small" style={{ fontSize: 14 }}>{label}</AppText>
      <AppText variant="bodyMedium" style={{ fontSize: 14 }}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  success: { borderRadius: radii.lg, backgroundColor: colors.success100, padding: 18 },
  awaiting: { borderRadius: radii.lg, borderWidth: 1, borderColor: colors.ochre, backgroundColor: colors.ochre100, padding: 18 },
  receipt: { borderRadius: radii.lg, borderWidth: 1, borderColor: colors.success, backgroundColor: colors.success100, padding: 18 },
  card: { borderWidth: 1, borderColor: colors.stone, borderRadius: radii.lg, backgroundColor: colors.white, padding: 18 },
  head: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.stone },
  totals: { marginTop: 12, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
