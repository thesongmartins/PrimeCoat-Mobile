import { ActivityIndicator, StyleSheet, View } from "react-native";
import { CircleAlert, WifiOff } from "lucide-react-native";
import { colors, radii } from "@/constants/theme";
import { isNetworkError, toUserMessage } from "@/lib/errors";
import { AppText } from "./AppText";
import { Button } from "./Button";

export function LoadingView({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityLabel={label}>
      <ActivityIndicator color={colors.terracotta} />
      <AppText variant="small" style={{ marginTop: 10 }}>{label}</AppText>
    </View>
  );
}

/** Query error with a retry. Never a blank screen. */
export function ErrorView({ error, onRetry, title = "We couldn't load this" }: { error: unknown; onRetry?: () => void; title?: string }) {
  const offline = isNetworkError(error);
  return (
    <View style={styles.center}>
      {offline ? <WifiOff color={colors.terracotta} size={32} /> : <CircleAlert color={colors.terracotta} size={32} />}
      <AppText variant="heading" style={styles.title}>{offline ? "You're offline" : title}</AppText>
      <AppText variant="body" style={styles.msg}>{toUserMessage(error)}</AppText>
      {onRetry && <Button variant="outline" onPress={onRetry} style={{ marginTop: 18 }}>Try again</Button>}
    </View>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <View style={styles.inline} accessibilityRole="alert">
      <AppText variant="small" style={{ color: colors.danger }}>{message}</AppText>
    </View>
  );
}

export function SkeletonBlock({ height, width = "100%", style }: { height: number; width?: number | `${number}%`; style?: object }) {
  return <View style={[{ height, width, backgroundColor: colors.stone200, borderRadius: radii.md }, style]} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, minHeight: 260 },
  title: { marginTop: 14, textAlign: "center" },
  msg: { marginTop: 6, textAlign: "center", color: colors.mute },
  inline: { borderRadius: radii.md, borderWidth: 1, borderColor: "rgba(178,58,58,0.3)", backgroundColor: colors.danger100, paddingHorizontal: 14, paddingVertical: 10 },
});
