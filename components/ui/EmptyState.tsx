import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radii } from "@/constants/theme";
import { AppText } from "./AppText";

/** Web EmptyState: dashed stone border on cream, terracotta icon, Fraunces title. */
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <View style={styles.box}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <AppText variant="title" style={styles.center}>{title}</AppText>
      {description && <AppText variant="body" style={[styles.center, styles.desc]}>{description}</AppText>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.stone400,
    backgroundColor: "rgba(243,239,232,0.6)",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  icon: { marginBottom: 18 },
  center: { textAlign: "center" },
  desc: { marginTop: 8, color: colors.mute },
  action: { marginTop: 22, alignSelf: "stretch" },
});
