import { forwardRef } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radii } from "@/constants/theme";
import { AppText } from "./AppText";

interface Props extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<TextInput, Props>(function TextField({ label, error, hint, style, editable = true, ...props }, ref) {
  return (
    <View style={styles.wrap}>
      <AppText variant="bodyMedium" style={styles.label}>{label}</AppText>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.stone400}
        editable={editable}
        accessibilityLabel={label}
        {...props}
        style={[styles.input, !editable && styles.locked, error ? styles.invalid : null, props.multiline && styles.multi, style]}
      />
      {error ? (
        <AppText variant="small" style={styles.error} accessibilityRole="alert">{error}</AppText>
      ) : hint ? (
        <AppText variant="small" style={styles.hint}>{hint}</AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14 },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.stone400,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.charcoal,
  },
  multi: { height: 90, paddingTop: 12, textAlignVertical: "top" },
  locked: { backgroundColor: colors.stone200, color: colors.charcoal600 },
  invalid: { borderColor: colors.danger },
  error: { color: colors.danger },
  hint: { color: colors.mute },
});
