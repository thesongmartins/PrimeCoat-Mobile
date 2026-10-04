/**
 * PrimeCoat design tokens, mirrored from the web app's app/globals.css (@theme).
 * Change them together.
 */
export const colors = {
  ink: "#121214",
  charcoal: "#1B1B1F",
  charcoal800: "#2A2A30",
  charcoal600: "#4A4A52",
  mute: "#6B665F",
  stone400: "#C9C2B8",
  stone: "#E8E3DC",
  stone200: "#F0ECE6",
  cream: "#F3EFE8",
  warmWhite: "#FAF8F5",
  white: "#FFFFFF",
  terracotta: "#C65D3B",
  terracotta700: "#A84A2C",
  terracotta100: "#F6E4DC",
  sage: "#7D8F7A",
  sage100: "#E6EBE4",
  sageText: "#4F5F4C",
  ochre: "#D9A441",
  ochre100: "#F8EDD3",
  ochreText: "#8A6418",
  success: "#3F7D4E",
  success100: "#E2F0E5",
  danger: "#B23A3A",
  danger100: "#F7E1E1",
} as const;

export const fonts = {
  display: "Fraunces_500Medium",
  displaySemibold: "Fraunces_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
} as const;

/** Web max is rounded-lg (8 px) except pills. */
export const radii = { sm: 4, md: 6, lg: 8, pill: 999 } as const;

export const spacing = { gutter: 20 } as const;

export const shadows = {
  card: {
    shadowColor: colors.charcoal,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
