import { useDeferredValue, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Search, X } from "lucide-react-native";
import { colors, fonts, radii } from "@/constants/theme";
import { useProducts } from "@/queries/products";
import { CATEGORY_LABELS, PRODUCT_CATEGORIES, type ProductCategory } from "@/types/product";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ProductCard } from "@/components/ProductCard";
import { AppText } from "@/components/ui/AppText";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView, InlineError, LoadingView } from "@/components/ui/StatusViews";
import { Button } from "@/components/ui/Button";

export default function ShopScreen() {
  // The selected category lives in the route (Home's category tiles link here), not in state.
  const { category: rawCategory } = useLocalSearchParams<{ category?: string }>();
  const category = PRODUCT_CATEGORIES.includes(rawCategory as ProductCategory) ? (rawCategory as ProductCategory) : undefined;
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search.trim());
  const [cartError, setCartError] = useState<string | null>(null);

  const products = useProducts({ query: query || undefined, category });

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader eyebrow="Shop" title={category ? CATEGORY_LABELS[category] : "All paints & tools"} />
      <View style={styles.controls}>
        <View style={styles.search}>
          <Search size={18} color={colors.mute} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search paints, colours, tools"
            placeholderTextColor={colors.mute}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search products"
          />
          {search ? (
            <Pressable onPress={() => setSearch("")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <X size={18} color={colors.mute} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" active={!category} onPress={() => router.setParams({ category: undefined })} />
          {PRODUCT_CATEGORIES.map((c) => (
            <Chip key={c} label={CATEGORY_LABELS[c]} active={category === c} onPress={() => router.setParams({ category: c })} />
          ))}
        </ScrollView>
      </View>

      {cartError ? <View style={{ paddingHorizontal: 20, paddingTop: 12 }}><InlineError message={cartError} /></View> : null}

      {products.isPending ? (
        <LoadingView label="Loading products…" />
      ) : products.isError && !products.data ? (
        <ErrorView error={products.error} onRetry={() => products.refetch()} />
      ) : (
        <FlatList
          data={products.data}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14 }}
          contentContainerStyle={styles.grid}
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={products.isRefetching} onRefresh={() => products.refetch()} tintColor={colors.terracotta} />}
          ListHeaderComponent={
            <AppText variant="small" style={{ marginBottom: 14 }}>
              {products.data?.length ?? 0} {products.data?.length === 1 ? "product" : "products"}
              {products.isFetching && !products.isRefetching ? " · updating…" : ""}
            </AppText>
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Search size={36} color={colors.terracotta} />}
              title="No products match"
              description="Try a different search or category."
              action={<Button variant="outline" onPress={() => { setSearch(""); router.setParams({ category: undefined }); }}>Clear filters</Button>}
            />
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1, maxWidth: "50%" }}>
              <ProductCard product={item} onError={setCartError} />
            </View>
          )}
        />
      )}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <AppText style={[styles.chipText, active && { color: colors.warmWhite }]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: { paddingTop: 14, gap: 12, backgroundColor: colors.warmWhite },
  search: { marginHorizontal: 20, height: 44, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.stone400, borderRadius: radii.md, backgroundColor: colors.white, paddingHorizontal: 12 },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.charcoal, paddingVertical: 0 },
  chips: { gap: 8, paddingHorizontal: 20, paddingBottom: 4 },
  chip: { borderWidth: 1, borderColor: colors.stone400, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.charcoal, borderColor: colors.charcoal },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.charcoal },
  grid: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
});
