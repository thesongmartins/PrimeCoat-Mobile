import { Pressable, StyleSheet, Text, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { colors, fonts, radii } from "@/constants/theme";

interface Props {
  value: number;
  max: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
  disabled?: boolean;
}

export function QuantityStepper({ value, max, onChange, min = 1, label, disabled }: Props) {
  const upper = Math.max(min, Math.min(max, 999));
  const canDec = !disabled && value > min;
  const canInc = !disabled && value < upper;
  return (
    <View style={styles.box} accessibilityLabel={label}>
      <Pressable
        onPress={() => canDec && onChange(value - 1)}
        disabled={!canDec}
        hitSlop={6}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed, !canDec && styles.off]}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
      >
        <Minus size={16} color={colors.charcoal} />
      </Pressable>
      <Text style={styles.value} accessibilityLiveRegion="polite">{value}</Text>
      <Pressable
        onPress={() => canInc && onChange(value + 1)}
        disabled={!canInc}
        hitSlop={6}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed, !canInc && styles.off]}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
      >
        <Plus size={16} color={colors.charcoal} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.stone400, borderRadius: radii.md, backgroundColor: colors.white, height: 38 },
  btn: { width: 38, height: "100%", alignItems: "center", justifyContent: "center" },
  pressed: { backgroundColor: colors.stone200 },
  off: { opacity: 0.35 },
  value: { minWidth: 30, textAlign: "center", fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.charcoal },
});
