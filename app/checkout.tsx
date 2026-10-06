import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { Lock } from "lucide-react-native";
import { useAuth, useUserId } from "@/providers/AuthProvider";
import { useCart } from "@/queries/cart";
import { useProfile } from "@/queries/profile";
import { usePlaceOrder } from "@/mutations/checkout";
import { showPaymentResult, usePaystackCheckout } from "@/mutations/payments";
import { checkoutSchema, type CheckoutInput } from "@/lib/checkout-schema";
import { toUserMessage } from "@/lib/errors";
import { useOnline } from "@/hooks/useOnline";
import { CartSummary } from "@/components/CartSummary";
import { StatePicker } from "@/components/StatePicker";
import { PaymentMethodPicker } from "@/components/PaymentMethodPicker";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ErrorView,
  InlineError,
  LoadingView,
} from "@/components/ui/StatusViews";

type Field = keyof CheckoutInput;

export default function CheckoutScreen() {
  const { user } = useAuth();
  const userId = useUserId();
  const insets = useSafeAreaInsets();
  const online = useOnline();
  const cart = useCart(userId);
  const profile = useProfile(userId);
  const placeOrder = usePlaceOrder();
  const openPaystack = usePaystackCheckout();
  const [paying, setPaying] = useState(false);

  // Form input is local UI state; defaults come from server data the first time they're needed.
  const [form, setForm] = useState<Partial<CheckoutInput>>({});
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  if (cart.isPending) return <LoadingView label="Loading your cart…" />;
  if (cart.isError && !cart.data)
    return <ErrorView error={cart.error} onRetry={() => cart.refetch()} />;

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const values: CheckoutInput = {
    fullName:
      form.fullName ??
      profile.data?.fullName ??
      (typeof meta.full_name === "string" ? meta.full_name : ""),
    // The order email is always the account email (the server enforces this too).
    email: user?.email ?? "",
    phone: form.phone ?? profile.data?.phone ?? "",
    deliveryAddress: form.deliveryAddress ?? "",
    city: form.city ?? "",
    state: (form.state ?? cart.data.deliveryState) as CheckoutInput["state"],
    deliveryInstructions: form.deliveryInstructions ?? "",
    // Card first, as on the web. If the server has no Paystack key it says so and nothing is created.
    paymentMethod: form.paymentMethod ?? "card",
  };
  const isCard = values.paymentMethod === "card";
  const set = (field: Field) => (text: string) => {
    setForm((f) => ({ ...f, [field]: text }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const lines = cart.data.lines;
  if (lines.length === 0 && !placeOrder.isPending && !placeOrder.isSuccess) {
    return (
      <View style={{ padding: 20 }}>
        <EmptyState
          title="Your cart is empty"
          description="Add something before checking out."
          action={
            <Button onPress={() => router.navigate("/shop")}>
              Browse Paints
            </Button>
          }
        />
      </View>
    );
  }

  const submit = () => {
    const parsed = checkoutSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Field;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    placeOrder.mutate(parsed.data, {
      onSuccess: async (res) => {
        if (res.paymentUrl) {
          // The order exists (cart emptied); now pay for it on Paystack.
          setPaying(true);
          await openPaystack(res.orderId, res.paymentUrl);
          return;
        }
        if (res.paymentError) {
          showPaymentResult({ orderId: res.orderId, status: "failed" });
          return;
        }
        router.replace({
          pathname: "/order/[id]",
          params: { id: res.orderId, placed: "1", email: res.emailStatus },
        });
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={[
          styles.wrap,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="eyebrow">Delivery details</AppText>
        <AppText variant="body" style={{ marginTop: 6 }}>
          We deliver across Nigeria.
        </AppText>

        <View style={styles.fields}>
          <TextField
            label="Full name"
            value={values.fullName}
            onChangeText={set("fullName")}
            error={errors.fullName}
            autoComplete="name"
            textContentType="name"
          />
          <TextField
            label="Email"
            value={values.email}
            editable={false}
            hint="Your confirmation goes to your account email."
            error={errors.email}
          />
          <TextField
            label="Phone number"
            value={values.phone}
            onChangeText={set("phone")}
            error={errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            placeholder="0803 123 4567"
          />
          <TextField
            label="Street address"
            value={values.deliveryAddress}
            onChangeText={set("deliveryAddress")}
            error={errors.deliveryAddress}
            autoComplete="street-address"
            textContentType="fullStreetAddress"
          />
          <TextField
            label="City or town"
            value={values.city}
            onChangeText={set("city")}
            error={errors.city}
            textContentType="addressCity"
          />
          <StatePicker
            label="State"
            value={values.state}
            onChange={set("state")}
            error={errors.state}
          />
          <TextField
            label="Delivery instructions (optional)"
            value={values.deliveryInstructions}
            onChangeText={set("deliveryInstructions")}
            error={errors.deliveryInstructions}
            multiline
          />
        </View>

        <View style={{ marginTop: 24 }}>
          <CartSummary lines={lines} deliveryState={values.state} final />
        </View>

        <View style={{ marginTop: 24, gap: 12 }}>
          <AppText variant="label">Payment</AppText>
          <PaymentMethodPicker
            value={values.paymentMethod}
            onChange={(paymentMethod) => setForm((f) => ({ ...f, paymentMethod }))}
          />
        </View>

        {placeOrder.isError ? (
          <View style={{ marginTop: 16 }}>
            <InlineError message={toUserMessage(placeOrder.error)} />
          </View>
        ) : null}

        <Button
          size="lg"
          onPress={submit}
          loading={placeOrder.isPending || paying}
          disabled={!online || placeOrder.isPending || placeOrder.isSuccess}
          style={{ marginTop: 20 }}
          // icon={placeOrder.isPending}
        >
          {paying
            ? "Opening secure payment…"
            : placeOrder.isPending
              ? "Placing order…"
              : isCard
                ? "Continue to payment"
                : "Place Order"}
        </Button>
        {!online ? (
          <AppText
            variant="small"
            style={{ marginTop: 8, textAlign: "center" }}
          >
            Connect to the internet to place your order.
          </AppText>
        ) : null}
        <AppText variant="small" style={{ marginTop: 12, textAlign: "center" }}>
          {isCard
            ? "You’ll pay securely on Paystack. Your confirmation email is sent once payment is confirmed."
            : "Prices and stock are confirmed by PrimeCoat when you place the order."}
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20 },
  fields: { marginTop: 18, gap: 16 },
});
