import { StyleSheet, View } from "react-native";
import { AppText } from "./AppText";

export function ColourSwatch({ hex, name }: { hex: string | null; name: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.swatch, { backgroundColor: hex ?? "#ccc" }]} />
      <AppText variant="small">{name}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(0,0,0,0.15)" },
});
