import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, fonts, radii } from "@/constants/theme";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const palette: Record<Variant, { bg: string; fg: string; border?: string; pressed: string }> = {
  primary: { bg: colors.charcoal, fg: colors.warmWhite, pressed: colors.charcoal800 },
  accent: { bg: colors.terracotta, fg: colors.warmWhite, pressed: colors.terracotta700 },
  outline: { bg: colors.white, fg: colors.charcoal, border: colors.charcoal, pressed: colors.stone200 },
  ghost: { bg: "transparent", fg: colors.charcoal, pressed: colors.stone200 },
};

const heights: Record<Size, number> = { sm: 36, md: 44, lg: 48 };

interface Props {
  children: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Button({ children, onPress, variant = "primary", size = "md", loading, disabled, icon, style, accessibilityLabel }: Props) {
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.base,
        {
          height: heights[size],
          paddingHorizontal: size === "sm" ? 14 : size === "md" ? 20 : 24,
          backgroundColor: pressed && !inactive ? p.pressed : p.bg,
          borderColor: p.border ?? "transparent",
          borderWidth: p.border ? 1 : 0,
          opacity: inactive && !loading ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator size="small" color={p.fg} /> : icon}
        {typeof children === "string" ? (
          <Text style={[styles.label, { color: p.fg, fontSize: size === "sm" ? 13 : size === "md" ? 14 : 15 }]}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontFamily: fonts.bodyMedium, letterSpacing: -0.1 },
});
