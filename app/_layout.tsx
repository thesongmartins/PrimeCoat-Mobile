import "@/lib/polyfills";
import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { useCartRealtime } from "@/hooks/useCartRealtime";
import { colors, fonts } from "@/constants/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Fraunces_500Medium, Fraunces_600SemiBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator ready={fontsLoaded || Boolean(fontError)} />
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator({ ready }: { ready: boolean }) {
  const { session, initializing } = useAuth();
  const signedIn = Boolean(session);

  // One Realtime subscription for the whole signed-in app; torn down on sign-out / user change.
  useCartRealtime(session?.user.id ?? null);

  useEffect(() => {
    if (ready && !initializing) void SplashScreen.hideAsync();
  }, [ready, initializing]);

  // Native splash stays up until fonts and the stored session are ready.
  if (!ready || initializing) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.warmWhite },
        headerStyle: { backgroundColor: colors.warmWhite },
        headerTintColor: colors.charcoal,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 18 },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[slug]" options={{ headerShown: true, title: "" }} />
        <Stack.Screen name="checkout" options={{ headerShown: true, title: "Checkout" }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: true, title: "Order" }} />
        <Stack.Screen name="payment-result" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack.Protected>
      <Stack.Screen name="auth/callback" />
    </Stack>
  );
}
