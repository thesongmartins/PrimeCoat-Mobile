import { StyleSheet, View } from "react-native";
import { WifiOff } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { useOnline } from "@/hooks/useOnline";
import { AppText } from "./ui/AppText";

/** The app is online-first: cached screens stay visible offline, writes wait for the network. */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <View style={styles.bar} accessibilityRole="alert">
      <WifiOff size={14} color={colors.warmWhite} />
      <AppText variant="small" style={styles.text}>You're offline. Showing saved data; changes will sync when you reconnect.</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.charcoal, paddingHorizontal: 16, paddingVertical: 8 },
  text: { color: colors.warmWhite, flex: 1, fontSize: 12 },
});
