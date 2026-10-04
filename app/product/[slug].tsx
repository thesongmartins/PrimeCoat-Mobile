import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import { useProduct } from "@/queries/products";
import { formatNaira } from "@/lib/format";
import { CATEGORY_LABELS } from "@/types/product";
import { ProductImage } from "@/components/ProductImage";
import { AddToCartButton } from "@/components/AddToCartButton";
import { AppText } from "@/components/ui/AppText";
import { StockBadge } from "@/components/ui/Badge";
import { ColourSwatch } from "@/components/ui/ColourSwatch";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView, InlineError, LoadingView } from "@/components/ui/StatusViews";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const product = useProduct(slug ?? "");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  if (product.isPending) return <LoadingView label="Loading product…" />;
  if (product.isError) return <ErrorView error={product.error} onRetry={() => product.refetch()} />;
  if (!product.data) {
    return (
      <View style={{ padding: 20 }}>
        <EmptyState title="Product not found" description="It may have been removed from the catalogue." action={<Button onPress={() => router.back()}>Back to shop</Button>} />
      </View>
    );
  }

  const p = product.data;
  const details = [
    ["Size", p.size],
    ["Finish", p.finish],
    ["Coverage", p.coverage],
    ["Colour", p.colourName],
  ].filter((d): d is [string, string] => Boolean(d[1]));

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: CATEGORY_LABELS[p.category] }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <ProductImage uri={p.imageUrl} radius={0} />
        <View style={styles.body}>
          <AppText variant="label">
            {CATEGORY_LABELS[p.category]}
            {p.size ? ` · ${p.size}` : ""}
          </AppText>
          <AppText variant="title" style={{ marginTop: 8 }}>{p.name}</AppText>
          {p.colourName ? <View style={{ marginTop: 10 }}><ColourSwatch hex={p.colourHex} name={p.colourName} /></View> : null}
          <View style={styles.priceRow}>
            <AppText variant="price" style={{ fontSize: 26 }}>{formatNaira(p.price)}</AppText>
            <StockBadge stockQuantity={p.stockQuantity} />
          </View>
          <AppText variant="body" style={{ marginTop: 16 }}>{p.description || p.shortDescription}</AppText>
          {details.length > 0 && (
            <View style={styles.details}>
              {details.map(([k, v]) => (
                <View key={k} style={styles.detailRow}>
                  <AppText variant="small">{k}</AppText>
                  <AppText variant="bodyMedium" style={{ fontSize: 14, flexShrink: 1, textAlign: "right" }}>{v}</AppText>
                </View>
              ))}
            </View>
          )}
          <AppText variant="small" style={{ marginTop: 16 }}>Pay on delivery · Nationwide delivery · Free over ₦150,000</AppText>
        </View>
      </ScrollView>

      <View style={[styles.buyBar, { paddingBottom: insets.bottom + 12 }]}>
        {error ? <View style={{ marginBottom: 10 }}><InlineError message={error} /></View> : null}
        <View style={styles.buyRow}>
          {p.stockQuantity > 0 ? (
            <QuantityStepper value={qty} max={p.stockQuantity} onChange={setQty} label={`quantity of ${p.name}`} />
          ) : null}
          <View style={{ flex: 1 }}>
            <AddToCartButton product={p} quantity={qty} size="lg" onError={setError} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  details: { marginTop: 20, borderTopWidth: 1, borderTopColor: colors.stone },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.stone },
  buyBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.warmWhite, borderTopWidth: 1, borderTopColor: colors.stone, paddingHorizontal: 20, paddingTop: 12 },
  buyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
