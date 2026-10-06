import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Banknote, CreditCard } from "lucide-react-native";
import { colors, radii } from "@/constants/theme";
import type { CheckoutInput } from "@/lib/checkout-schema";
import { AppText } from "@/components/ui/AppText";

type Method = CheckoutInput["paymentMethod"];

/** Same two options and wording as the web checkout's Payment fieldset. */
export function PaymentMethodPicker({ value, onChange }: { value: Method; onChange: (m: Method) => void }) {
  return (
    <View style={{ gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel="Payment method">
      <Option
        selected={value === "card"}
        onPress={() => onChange("card")}
        icon={<CreditCard size={20} color={colors.terracotta} />}
        title="Pay now with card"
        body="Secure payment by card, bank transfer or USSD through Paystack. You’ll come back to the app once it’s done."
      />
      <Option
        selected={value === "pay_on_delivery"}
        onPress={() => onChange("pay_on_delivery")}
        icon={<Banknote size={20} color={colors.terracotta} />}
        title="Pay on Delivery"
        body="Pay the driver in cash or by bank transfer when your order arrives."
      />
    </View>
  );
}

function Option({ selected, onPress, icon, title, body }: { selected: boolean; onPress: () => void; icon: ReactNode; title: string; body: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      style={[styles.option, selected && styles.selected]}
    >
      <View style={styles.icon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium">{title}</AppText>
        <AppText variant="small" style={{ marginTop: 2 }}>{body}</AppText>
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.stone,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
  },
  selected: { borderColor: colors.charcoal },
  icon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.terracotta100, alignItems: "center", justifyContent: "center" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.stone400, alignItems: "center", justifyContent: "center", marginTop: 2 },
  radioOn: { borderColor: colors.charcoal },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.charcoal },
});
