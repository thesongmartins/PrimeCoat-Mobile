import { Text, type TextProps, type TextStyle } from "react-native";
import { colors, fonts } from "@/constants/theme";

type Variant = "display" | "title" | "heading" | "body" | "bodyMedium" | "small" | "eyebrow" | "label" | "price";

const styles: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 38, lineHeight: 40, letterSpacing: -0.8, color: colors.charcoal },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.5, color: colors.charcoal },
  heading: { fontFamily: fonts.display, fontSize: 19, lineHeight: 24, letterSpacing: -0.2, color: colors.charcoal },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.charcoal600 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 21, color: colors.charcoal },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.mute },
  // .eyebrow on the web: 11px, semibold, uppercase, 0.18em tracking, terracotta.
  eyebrow: { fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: colors.terracotta },
  label: { fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: colors.mute },
  price: { fontFamily: fonts.displaySemibold, fontSize: 17, color: colors.charcoal },
};

export function AppText({ variant = "body", style, ...props }: TextProps & { variant?: Variant }) {
  return <Text {...props} style={[styles[variant], style]} />;
}
