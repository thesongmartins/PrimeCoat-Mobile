import { forwardRef, type ReactNode } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radii } from "@/constants/theme";
import { AppText } from "./AppText";

interface Props extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  /** Shown inside the input on the right, e.g. a show-password toggle. */
  trailing?: ReactNode;
}

export const TextField = forwardRef<TextInput, Props>(function TextField({ label, error, hint, trailing, style, editable = true, ...props }, ref) {
  return (
    <View style={styles.wrap}>
      <AppText variant="bodyMedium" style={styles.label}>{label}</AppText>
      <View>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.stone400}
          editable={editable}
          accessibilityLabel={label}
          {...props}
          style={[styles.input, !editable && styles.locked, error ? styles.invalid : null, props.multiline && styles.multi, trailing ? styles.withTrailing : null, style]}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
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
  withTrailing: { paddingRight: 48 },
  trailing: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },
  multi: { height: 90, paddingTop: 12, textAlignVertical: "top" },
  locked: { backgroundColor: colors.stone200, color: colors.charcoal600 },
  invalid: { borderColor: colors.danger },
  error: { color: colors.danger },
  hint: { color: colors.mute },
});
