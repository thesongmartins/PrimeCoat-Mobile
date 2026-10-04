import { Tabs } from "expo-router";
import { House, Package, ShoppingBag, Store, User } from "lucide-react-native";
import { colors, fonts } from "@/constants/theme";
import { useUserId } from "@/providers/AuthProvider";
import { useCartCount } from "@/queries/cart";

export default function TabsLayout() {
  const cartCount = useCartCount(useUserId());
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.warmWhite },
        tabBarActiveTintColor: colors.charcoal,
        tabBarInactiveTintColor: colors.mute,
        tabBarStyle: { backgroundColor: colors.warmWhite, borderTopColor: colors.stone },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        tabBarBadgeStyle: { backgroundColor: colors.terracotta, color: colors.warmWhite, fontFamily: fonts.bodySemibold, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <House color={color} size={size - 2} /> }} />
      <Tabs.Screen name="shop" options={{ title: "Shop", tabBarIcon: ({ color, size }) => <Store color={color} size={size - 2} /> }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size - 2} />,
          tabBarBadge: cartCount > 0 ? (cartCount > 99 ? "99+" : cartCount) : undefined,
          tabBarAccessibilityLabel: cartCount > 0 ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : "Cart, empty",
        }}
      />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color, size }) => <Package color={color} size={size - 2} /> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} /> }} />
    </Tabs>
  );
}
