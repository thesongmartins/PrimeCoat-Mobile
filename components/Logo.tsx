import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, fonts } from "@/constants/theme";
import { AppText } from "./ui/AppText";

/** The web logo mark (components/layout/logo.tsx): charcoal tile, warm-white P, terracotta counter. */
export function LogoMark({ size = 32, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: inverse ? colors.warmWhite : colors.charcoal }]}>
      <Svg viewBox="0 0 24 24" width={size * 0.625} height={size * 0.625}>
        <Path d="M5 4h9a5 5 0 0 1 0 10H9v6H5V4Z" fill={inverse ? colors.charcoal : colors.warmWhite} />
        <Path d="M9 8h5a1 1 0 0 1 0 2H9V8Z" fill={colors.terracotta} />
      </Svg>
    </View>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <View style={styles.row} accessibilityLabel="PrimeCoat">
      <LogoMark size={size} />
      <AppText style={[styles.word, { fontSize: size * 0.68 }]}>PrimeCoat</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: 4, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  word: { fontFamily: fonts.displaySemibold, color: colors.charcoal, letterSpacing: -0.4 },
});
