import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/constants/theme";
import { getStockStatus } from "@/types/product";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types/order";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent" | "info";

const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.stone200, fg: colors.charcoal600 },
  success: { bg: colors.success100, fg: colors.success },
  warning: { bg: colors.ochre100, fg: colors.ochreText },
  danger: { bg: colors.danger100, fg: colors.danger },
  accent: { bg: colors.terracotta100, fg: colors.terracotta700 },
  info: { bg: colors.sage100, fg: colors.sageText },
};

export function Badge({ label, tone = "neutral", dot = false }: { label: string; tone?: Tone; dot?: boolean }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: t.fg }]} />}
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function StockBadge({ stockQuantity }: { stockQuantity: number }) {
  const status = getStockStatus(stockQuantity);
  if (status === "in_stock") return <Badge tone="success" dot label="In stock" />;
  if (status === "low_stock") return <Badge tone="warning" dot label={`Only ${stockQuantity} left`} />;
  return <Badge tone="danger" dot label="Out of stock" />;
}

const ORDER_TONES: Record<OrderStatus, Tone> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  out_for_delivery: "accent",
  delivered: "success",
  cancelled: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONES[status]} label={ORDER_STATUS_LABELS[status]} />;
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: fonts.bodyMedium, fontSize: 12 },
});
