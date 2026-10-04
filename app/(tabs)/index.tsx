import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUpRight } from "lucide-react-native";
import { colors, radii } from "@/constants/theme";
import { useFeaturedProducts } from "@/queries/products";
import { useProfile } from "@/queries/profile";
import { useUserId } from "@/providers/AuthProvider";
import { CATEGORY_LABELS, type ProductCategory } from "@/types/product";
import { Logo } from "@/components/Logo";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ProductCard } from "@/components/ProductCard";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ErrorView, SkeletonBlock } from "@/components/ui/StatusViews";

// Same hero photograph and tiles as the web homepage.
const HERO = "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=80";
const TILES: { category: ProductCategory; blurb: string; swatches: string[] }[] = [
  { category: "interior", blurb: "Matt, silk and washable emulsions", swatches: ["#EDE6DA", "#9AA88F", "#D9A99A", "#2F5F5C"] },
  { category: "exterior", blurb: "Weather-resistant façade paints", swatches: ["#F7F6F2", "#D4C4A8", "#6E7178"] },
  { category: "primer", blurb: "Sealers and undercoats", swatches: ["#E8E3DC", "#9C9EA3"] },
  { category: "gloss", blurb: "Enamels for doors, trims and metal", swatches: ["#FFFFFF", "#C8322B", "#111113"] },
  { category: "accessories", blurb: "Tape, trays, sandpaper and cloths", swatches: ["#F2E3B5", "#1B1B1F"] },
  { category: "tools", blurb: "Rollers, brushes and mixers", swatches: ["#C65D3B", "#8A5A3C"] },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const userId = useUserId();
  const featured = useFeaturedProducts();
  const profile = useProfile(userId);
  const firstName = profile.data?.fullName?.split(" ")[0];
  const cardWidth = Math.min(220, width * 0.56);

  return (
    <View style={{ flex: 1, backgroundColor: colors.warmWhite }}>
      <View style={{ paddingTop: insets.top, backgroundColor: colors.cream }}>
        <OfflineBanner />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={featured.isRefetching} onRefresh={() => featured.refetch()} tintColor={colors.terracotta} />}
      >
        <View style={styles.hero}>
          <View style={styles.topbar}>
            <Logo size={30} />
            {firstName ? <AppText variant="small">Hi, {firstName}</AppText> : null}
          </View>
          <AppText variant="eyebrow" style={{ marginTop: 28 }}>Paint shop & painting services · Nigeria</AppText>
          <AppText variant="display" style={{ marginTop: 12 }}>Quality Paints.{"\n"}Professional Finishes.</AppText>
          <AppText variant="body" style={{ marginTop: 14 }}>
            Premium interior and exterior paints, primers and finishes — delivered across Nigeria, paid on delivery.
          </AppText>
          <Button size="lg" onPress={() => router.navigate("/shop")} style={{ marginTop: 22 }}>Shop Paints</Button>
          <View style={styles.points}>
            {["Pay on Delivery", "Nationwide delivery", "Trade packs available", "Colour consultation"].map((t) => (
              <View key={t} style={styles.point}>
                <View style={styles.dot} />
                <AppText variant="small" style={{ color: colors.charcoal600 }}>{t}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.heroImage}>
            <Image source={{ uri: HERO }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityLabel="Living room with a deep green painted feature wall" />
            <View style={styles.swatchCard}>
              <View style={[styles.swatchDot, { backgroundColor: "#2F5F5C" }]} />
              <View>
                <AppText variant="bodyMedium" style={{ fontSize: 13 }}>Lagoon Teal</AppText>
                <AppText variant="small" style={{ fontSize: 11 }}>Silk Sheen Interior Emulsion</AppText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="eyebrow">Shop by category</AppText>
          <AppText variant="title" style={styles.sectionTitle}>Everything from primer to final coat</AppText>
          <View style={styles.tiles}>
            {TILES.map((t) => (
              <Pressable
                key={t.category}
                onPress={() => router.navigate({ pathname: "/shop", params: { category: t.category } })}
                style={({ pressed }) => [styles.tile, pressed && { borderColor: colors.charcoal }]}
                accessibilityRole="button"
                accessibilityLabel={`Shop ${CATEGORY_LABELS[t.category]}`}
              >
                <View style={{ flexDirection: "row" }}>
                  {t.swatches.map((hex, i) => (
                    <View key={hex} style={[styles.tileSwatch, { backgroundColor: hex, marginLeft: i === 0 ? 0 : -6 }]} />
                  ))}
                </View>
                <View style={{ marginTop: 22 }}>
                  <View style={styles.tileTitleRow}>
                    <AppText variant="heading" style={{ fontSize: 17 }}>{CATEGORY_LABELS[t.category]}</AppText>
                    <ArrowUpRight size={15} color={colors.mute} />
                  </View>
                  <AppText variant="small" style={{ marginTop: 2, fontSize: 12 }}>{t.blurb}</AppText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.featured]}>
          <AppText variant="eyebrow">Featured products</AppText>
          <AppText variant="title" style={styles.sectionTitle}>Our most-loved paints and tools</AppText>
          {featured.isPending ? (
            <View style={{ flexDirection: "row", gap: 16, marginTop: 20 }}>
              <SkeletonBlock height={cardWidth} width={cardWidth} />
              <SkeletonBlock height={cardWidth} width={cardWidth} />
            </View>
          ) : featured.isError ? (
            <ErrorView error={featured.error} onRetry={() => featured.refetch()} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingTop: 20, paddingRight: 20 }}>
              {featured.data.map((p) => (
                <ProductCard key={p.id} product={p} width={cardWidth} />
              ))}
            </ScrollView>
          )}
          <Button variant="outline" onPress={() => router.navigate("/shop")} style={{ marginRight: 20 }}>Shop all</Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.cream, paddingHorizontal: 20, paddingBottom: 28, borderBottomWidth: 1, borderBottomColor: colors.stone },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12 },
  points: { flexDirection: "row", flexWrap: "wrap", rowGap: 10, marginTop: 22 },
  point: { flexDirection: "row", alignItems: "center", gap: 8, width: "50%" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.terracotta },
  heroImage: { marginTop: 26, width: "100%", aspectRatio: 4 / 3, borderRadius: radii.lg, overflow: "hidden", backgroundColor: colors.stone },
  swatchCard: { position: "absolute", left: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(250,248,245,0.95)", borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 8 },
  swatchDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
  section: { paddingHorizontal: 20, paddingVertical: 32 },
  sectionTitle: { marginTop: 8, fontSize: 24, lineHeight: 28 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 },
  tile: { width: "47.5%", flexGrow: 1, borderWidth: 1, borderColor: colors.stone, borderRadius: radii.lg, backgroundColor: colors.white, padding: 14 },
  tileSwatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.white },
  tileTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  featured: { backgroundColor: colors.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.stone, paddingRight: 0 },
});
