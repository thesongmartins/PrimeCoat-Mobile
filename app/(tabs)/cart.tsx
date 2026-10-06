import { useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { useUserId } from "@/providers/AuthProvider";
import { useCart } from "@/queries/cart";
import { useClearCart, useRemoveFromCart, useSetCartQuantity, useSetDeliveryState } from "@/mutations/cart";
import { toUserMessage } from "@/lib/errors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CartLineRow } from "@/components/CartLineRow";
import { CartSummary } from "@/components/CartSummary";
import { StatePicker } from "@/components/StatePicker";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView, InlineError, LoadingView } from "@/components/ui/StatusViews";

/** The shared Supabase cart: identical rows to the web cart, kept live by useCartRealtime. */
export default function CartScreen() {
  const userId = useUserId();
  const cart = useCart(userId);
  const setQuantity = useSetCartQuantity();
  const remove = useRemoveFromCart();
  const clear = useClearCart();
  const setState = useSetDeliveryState();
  const [error, setError] = useState<string | null>(null);

  const onError = (e: unknown) => setError(toUserMessage(e, "We couldn't update your cart. Your previous cart has been restored."));
  const header = <ScreenHeader eyebrow="Your cart" title="Cart" />;

  if (cart.isPending) return <View style={{ flex: 1 }}>{header}<LoadingView label="Loading your cart…" /></View>;
  if (cart.isError && !cart.data) return <View style={{ flex: 1 }}>{header}<ErrorView error={cart.error} onRetry={() => cart.refetch()} /></View>;

  const { lines, deliveryState } = cart.data;

  return (
    <View style={{ flex: 1 }}>
      {header}
      <FlatList
        data={lines}
        keyExtractor={(l) => l.productId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={cart.isRefetching} onRefresh={() => cart.refetch()} tintColor={colors.terracotta} />}
        ListHeaderComponent={error ? <View style={{ marginTop: 16 }}><InlineError message={error} /></View> : null}
        ListEmptyComponent={
          <View style={{ marginTop: 24 }}>
            <EmptyState
              icon={<ShoppingBag size={40} color={colors.terracotta} />}
              title="Your cart is waiting for its first coat of colour."
              description="Browse our interior and exterior emulsions, primers and tools, and add what you need."
              action={<Button size="lg" onPress={() => router.navigate("/shop")}>Browse Paints</Button>}
            />
          </View>
        }
        renderItem={({ item }) => (
          <CartLineRow
            line={item}
            onQuantityChange={(q) => {
              setError(null);
              setQuantity.mutate({ productId: item.productId, quantity: q, stockQuantity: item.stockQuantity }, { onError });
            }}
            onRemove={() => {
              setError(null);
              remove.mutate({ productId: item.productId }, { onError });
            }}
          />
        )}
        ListFooterComponent={
          lines.length > 0 ? (
            <View style={{ marginTop: 24, gap: 16 }}>
              <CartSummary
                lines={lines}
                deliveryState={deliveryState}
                picker={<StatePicker value={deliveryState} onChange={(s) => setState.mutate({ state: s }, { onError })} />}
              >
                <Button size="lg" onPress={() => router.push("/checkout")}>Proceed to Checkout</Button>
              </CartSummary>
              <Button
                variant="ghost"
                onPress={() =>
                  Alert.alert("Clear cart?", "This removes every item from your cart on all your devices.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Clear cart", style: "destructive", onPress: () => clear.mutate(undefined, { onError }) },
                  ])
                }
              >
                Clear cart
              </Button>
              <AppText variant="small" style={{ textAlign: "center" }}>
                Changes here appear instantly on primecoatt.vercel.app when you’re signed in to the same account.
              </AppText>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingBottom: 40 },
});
