import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radii } from "@/constants/theme";
import { cartTotals, FREE_DELIVERY_THRESHOLD } from "@/lib/cart-calculations";
import { formatNaira } from "@/lib/format";
import type { CartLine } from "@/types/cart";
import { AppText } from "./ui/AppText";

/** Mirrors components/cart/cart-summary.tsx on the web. */
export function CartSummary({ lines, deliveryState, final = false, children, picker }: {
  lines: CartLine[];
  deliveryState: string;
  final?: boolean;
  children?: ReactNode;
  picker?: ReactNode;
}) {
  const t = cartTotals(lines, deliveryState);
  const remaining = FREE_DELIVERY_THRESHOLD - t.subtotal;
  return (
    <View style={styles.box}>
      <AppText variant="heading">Order summary</AppText>
      {picker ? <View style={{ marginTop: 16 }}>{picker}</View> : null}
      <View style={styles.rows}>
        <Row label={`Subtotal (${t.itemCount} ${t.itemCount === 1 ? "item" : "items"})`} value={formatNaira(t.subtotal)} />
        <Row
          label={`${final ? "Delivery" : "Estimated delivery"} · ${deliveryState}`}
          value={t.deliveryFee === 0 ? "Free" : formatNaira(t.deliveryFee)}
          valueColor={t.deliveryFee === 0 ? colors.success : undefined}
        />
        <View style={styles.total}>
          <AppText variant="bodyMedium">Total</AppText>
          <AppText variant="price" style={{ fontSize: 22 }}>{formatNaira(t.total)}</AppText>
        </View>
      </View>
      {remaining > 0 && t.subtotal > 0 ? (
        <View style={styles.hint}>
          <AppText variant="small" style={{ color: colors.charcoal600, fontSize: 12 }}>
            Add <AppText variant="small" style={{ fontFamily: "Inter_600SemiBold", color: colors.charcoal, fontSize: 12 }}>{formatNaira(remaining)}</AppText> more for free delivery.
          </AppText>
        </View>
      ) : null}
      {!final ? <AppText variant="small" style={{ marginTop: 10, fontSize: 12 }}>Final delivery fee is confirmed at checkout. Payment is made on delivery.</AppText> : null}
      {children ? <View style={{ marginTop: 18 }}>{children}</View> : null}
    </View>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="small" style={{ flex: 1, fontSize: 14 }}>{label}</AppText>
      <AppText variant="bodyMedium" style={[{ fontSize: 14 }, valueColor ? { color: valueColor } : null]}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: colors.stone, borderRadius: radii.lg, backgroundColor: colors.white, padding: 18 },
  rows: { marginTop: 16, gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  total: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.stone, paddingTop: 12, marginTop: 2 },
  hint: { marginTop: 14, backgroundColor: colors.cream, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 8 },
});
