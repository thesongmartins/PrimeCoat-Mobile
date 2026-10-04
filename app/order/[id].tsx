import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { CircleCheck } from "lucide-react-native";
import { colors, radii } from "@/constants/theme";
import { useUserId } from "@/providers/AuthProvider";
import { useOrder } from "@/queries/orders";
import { formatDate, formatNaira } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/types/order";
import { ProductImage } from "@/components/ProductImage";
import { AppText } from "@/components/ui/AppText";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView, LoadingView } from "@/components/ui/StatusViews";

/** Order detail; doubles as the confirmation screen right after checkout (?placed=1). */
export default function OrderScreen() {
  const { id, placed, email } = useLocalSearchParams<{ id: string; placed?: string; email?: string }>();
  const userId = useUserId();
  const order = useOrder(userId, id ?? "");
  const justPlaced = placed === "1";

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
  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={order.isRefetching} onRefresh={() => order.refetch()} tintColor={colors.terracotta} />}
    >
      <Stack.Screen options={{ title: justPlaced ? "Order confirmed" : o.orderNumber, headerBackVisible: !justPlaced }} />

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
          <OrderStatusBadge status={o.status} />
        </View>
        <AppText variant="small" style={{ marginTop: 6 }}>Placed {formatDate(o.createdAt)} · {PAYMENT_METHOD_LABELS[o.paymentMethod]}</AppText>
      </View>

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

      {justPlaced && (
        <View style={{ gap: 10 }}>
          <Button size="lg" onPress={() => router.replace("/orders")}>View all orders</Button>
          <Button variant="outline" size="lg" onPress={() => router.replace("/shop")}>Continue shopping</Button>
        </View>
      )}
    </ScrollView>
  );
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
  card: { borderWidth: 1, borderColor: colors.stone, borderRadius: radii.lg, backgroundColor: colors.white, padding: 18 },
  head: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.stone },
  totals: { marginTop: 12, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
