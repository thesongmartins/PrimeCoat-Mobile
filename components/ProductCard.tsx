import { Pressable, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { formatNaira } from "@/lib/format";
import { CATEGORY_LABELS, type Product } from "@/types/product";
import { AppText } from "./ui/AppText";
import { StockBadge } from "./ui/Badge";
import { ColourSwatch } from "./ui/ColourSwatch";
import { ProductImage } from "./ProductImage";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ product, width, onError }: { product: Product; width?: number; onError?: (m: string) => void }) {
  return (
    <View style={[styles.card, width ? { width } : { flex: 1 }]}>
      <Link href={{ pathname: "/product/[slug]", params: { slug: product.slug } }} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={`View ${product.name}`}>
          <ProductImage uri={product.imageUrl} />
          <View style={styles.badge}>
            <StockBadge stockQuantity={product.stockQuantity} />
          </View>
          <AppText variant="label" style={styles.category} numberOfLines={1}>
            {CATEGORY_LABELS[product.category]}
            {product.size ? <AppText variant="small" style={styles.size}> · {product.size}</AppText> : null}
          </AppText>
          <AppText variant="heading" style={styles.name} numberOfLines={2}>{product.name}</AppText>
          <View style={styles.meta}>
            {product.colourName ? (
              <ColourSwatch hex={product.colourHex} name={product.colourName} />
            ) : (
              <AppText variant="small" numberOfLines={1}>{product.shortDescription}</AppText>
            )}
          </View>
        </Pressable>
      </Link>
      <View style={styles.footer}>
        <AppText variant="price">{formatNaira(product.price)}</AppText>
        <AddToCartButton product={product} size="sm" compact onError={onError} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 24 },
  badge: { position: "absolute", left: 8, top: 8 },
  category: { marginTop: 12, fontSize: 10, letterSpacing: 1.4 },
  size: { fontSize: 11, textTransform: "none", letterSpacing: 0 },
  name: { marginTop: 4, fontSize: 16, lineHeight: 20 },
  meta: { marginTop: 6, minHeight: 18 },
  footer: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
});

