import { StyleSheet, View } from "react-native";
import { useIsMutating } from "@tanstack/react-query";
import { colors } from "@/constants/theme";
import { CART_MUTATION_KEY } from "@/lib/query-keys";
import { useSyncStore } from "@/stores/sync";
import { useOnline } from "@/hooks/useOnline";
import { AppText } from "./ui/AppText";

/**
 * Shows the cart's sync state: Live (Realtime connected), Syncing… (a cart write is in flight),
 * Waiting for connection (offline; writes are paused and resume automatically), Reconnecting.
 */
export function SyncIndicator() {
  const realtime = useSyncStore((s) => s.realtime);
  const pending = useIsMutating({ mutationKey: CART_MUTATION_KEY });
  const online = useOnline();

  let label = "Connecting…";
  let tone: string = colors.stone400;
  if (!online) {
    label = pending ? "Waiting for connection" : "Offline";
    tone = colors.danger;
  } else if (pending > 0) {
    label = "Syncing…";
    tone = colors.ochre;
  } else if (realtime === "live") {
    label = "Live";
    tone = colors.success;
  } else if (realtime === "reconnecting") {
    label = "Reconnecting…";
    tone = colors.ochre;
  }

  return (
    <View style={styles.row} accessibilityLabel={`Cart sync: ${label}`} accessibilityLiveRegion="polite">
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <AppText variant="small" style={styles.text}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 12 },
});
