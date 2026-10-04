import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import { AppText } from "./ui/AppText";
import { OfflineBanner } from "./OfflineBanner";

/** Top of every tab: eyebrow + Fraunces title, like the web's page headers. */
export function ScreenHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.warmWhite }}>
      <OfflineBanner />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {eyebrow && <AppText variant="eyebrow">{eyebrow}</AppText>}
          <AppText variant="title" style={{ marginTop: eyebrow ? 6 : 0 }}>{title}</AppText>
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.stone },
});
