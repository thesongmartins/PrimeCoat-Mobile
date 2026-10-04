import { Pressable, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { formatNaira } from "@/lib/format";
import { lineSubtotal } from "@/lib/cart-calculations";
import type { CartLine } from "@/types/cart";
import { AppText } from "./ui/AppText";
import { ColourSwatch } from "./ui/ColourSwatch";
import { QuantityStepper } from "./ui/QuantityStepper";
import { ProductImage } from "./ProductImage";

export function CartLineRow({ line, onQuantityChange, onRemove }: { line: CartLine; onQuantityChange: (q: number) => void; onRemove: () => void }) {
  const pending = line.lineId.startsWith("pending:");
  return (
    <View style={[styles.row, pending && { opacity: 0.7 }]}>
      <Link href={{ pathname: "/product/[slug]", params: { slug: line.slug } }} asChild>
        <Pressable style={{ width: 84 }} accessibilityRole="link" accessibilityLabel={`View ${line.name}`}>
          <ProductImage uri={line.imageUrl} radius={6} />
        </Pressable>
      </Link>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="heading" style={{ fontSize: 16, lineHeight: 20 }} numberOfLines={2}>{line.name}</AppText>
        <View style={styles.meta}>
          {line.colourName ? <ColourSwatch hex={line.colourHex} name={line.colourName} /> : null}
          {line.size ? <AppText variant="small">{line.size}</AppText> : null}
          <AppText variant="small">{formatNaira(line.price)} each</AppText>
        </View>
        <View style={styles.controls}>
          <QuantityStepper value={line.quantity} max={line.stockQuantity} onChange={onQuantityChange} label={`quantity for ${line.name}`} disabled={pending} />
          <AppText variant="price" style={{ fontSize: 16 }}>{formatNaira(lineSubtotal(line))}</AppText>
        </View>
        <Pressable onPress={onRemove} disabled={pending} hitSlop={8} style={styles.remove} accessibilityRole="button" accessibilityLabel={`Remove ${line.name} from cart`}>
          <Trash2 size={15} color={colors.mute} />
          <AppText variant="small">Remove</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.stone },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 10, rowGap: 2, marginTop: 4 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  remove: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10, alignSelf: "flex-start" },
});
