import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ChevronDown, X } from "lucide-react-native";
import { colors, fonts, radii } from "@/constants/theme";
import { NIGERIA_STATES } from "@/constants/nigeria-states";
import { AppText } from "./ui/AppText";

/** Native replacement for the web's <select> of Nigerian states. */
export function StatePicker({ value, onChange, label = "Deliver to", error }: { value: string; onChange: (s: string) => void; label?: string; error?: string }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, error ? { borderColor: colors.danger } : null]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || "select a state"}`}
      >
        <AppText variant="bodyMedium" style={{ fontSize: 15 }}>{value || "Select a state"}</AppText>
        <ChevronDown size={18} color={colors.mute} />
      </Pressable>
      {error ? <AppText variant="small" style={{ color: colors.danger }}>{error}</AppText> : null}
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)} presentationStyle="pageSheet">
        <View style={[styles.sheet, { paddingTop: insets.top + 8 }]}>
          <View style={styles.sheetHeader}>
            <AppText variant="heading">Select your state</AppText>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <X size={22} color={colors.charcoal} />
            </Pressable>
          </View>
          <FlatList
            data={NIGERIA_STATES}
            keyExtractor={(s) => s}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.stone200 }]}
                accessibilityRole="button"
                accessibilityState={{ selected: item === value }}
              >
                <AppText style={[styles.optionText, item === value && { fontFamily: fonts.bodySemibold, color: colors.charcoal }]}>{item}</AppText>
                {item === value && <Check size={18} color={colors.terracotta} />}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.stone400,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheet: { flex: 1, backgroundColor: colors.warmWhite },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.stone },
  option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.stone },
  optionText: { fontFamily: fonts.body, fontSize: 16, color: colors.charcoal600 },
});
