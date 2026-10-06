import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { ChevronRight, Package } from "lucide-react-native";
import { colors, radii } from "@/constants/theme";
import { useUserId } from "@/providers/AuthProvider";
import { useOrders } from "@/queries/orders";
import { formatDate, formatNaira } from "@/lib/format";
import { isAwaitingPayment } from "@/types/order";
import { ScreenHeader } from "@/components/ScreenHeader";
import { AppText } from "@/components/ui/AppText";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView, LoadingView } from "@/components/ui/StatusViews";

/** Every order for this account — placed on the web or here. RLS returns only the owner's rows. */
export default function OrdersScreen() {
  const userId = useUserId();
  const orders = useOrders(userId);
  const header = <ScreenHeader eyebrow="Account" title="Your orders" />;

  if (orders.isPending)
    return (
      <View style={{ flex: 1 }}>
        {header}
        <LoadingView label="Loading your orders…" />
      </View>
    );
  if (orders.isError && !orders.data)
    return (
      <View style={{ flex: 1 }}>
        {header}
        <ErrorView error={orders.error} onRetry={() => orders.refetch()} />
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      {header}
      <FlatList
        data={orders.data}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={orders.isRefetching}
            onRefresh={() => orders.refetch()}
            tintColor={colors.terracotta}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Package size={40} color={colors.terracotta} />}
            title="No orders yet"
            description="When you place an order on the app or the website it will appear here."
            action={
              <Button size="lg" onPress={() => router.navigate("/shop")}>
                Start shopping
              </Button>
            }
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/order/[id]", params: { id: item.id } })
            }
            style={({ pressed }) => [
              styles.card,
              pressed && { borderColor: colors.charcoal },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Order ${item.orderNumber}`}
          >
            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.top}>
                <AppText variant="bodyMedium">{item.orderNumber}</AppText>
                <OrderStatusBadge status={item.status} awaitingPayment={isAwaitingPayment(item)} />
              </View>
              <AppText variant="small">
                {formatDate(item.createdAt)} · {item.itemCount}{" "}
                {item.itemCount === 1 ? "item" : "items"}
              </AppText>
              <AppText variant="price">{formatNaira(item.total)}</AppText>
            </View>
            <ChevronRight size={18} color={colors.mute} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.stone,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    padding: 16,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
});
