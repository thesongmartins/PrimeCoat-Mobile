import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { colors, radii } from "@/constants/theme";

/** Product renders are SVGs served by the web app; expo-image renders SVG natively. */
export function ProductImage({ uri, style, radius = radii.lg }: { uri: string | null; style?: StyleProp<ViewStyle>; radius?: number }) {
  return (
    <View style={[styles.frame, { borderRadius: radius }, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} cachePolicy="memory-disk" accessibilityIgnoresInvertColors />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", backgroundColor: colors.cream, aspectRatio: 1 },
});
