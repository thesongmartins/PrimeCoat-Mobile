import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { ChevronRight, LogOut, Package } from "lucide-react-native";
import { colors, fonts, radii } from "@/constants/theme";
import { useAuth, useUserId } from "@/providers/AuthProvider";
import { useProfile } from "@/queries/profile";
import { useOrders } from "@/queries/orders";
import { useSignOut } from "@/mutations/auth";
import { formatDate } from "@/lib/format";
import { ScreenHeader } from "@/components/ScreenHeader";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ErrorView, SkeletonBlock } from "@/components/ui/StatusViews";

export default function AccountScreen() {
  const { user } = useAuth();
  const userId = useUserId();
  const profile = useProfile(userId);
  const orders = useOrders(userId);
  const signOut = useSignOut();

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    profile.data?.fullName ??
    (typeof meta.full_name === "string" ? meta.full_name : null);
  const email = user?.email ?? profile.data?.email ?? "";
  const avatar =
    profile.data?.avatarUrl ??
    (typeof meta.avatar_url === "string" ? meta.avatar_url : null);
  const provider =
    user?.app_metadata?.provider === "google" ? "Google" : "Email and password";
  const initials = (name ?? email)
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader eyebrow="Account" title="Your account" />
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={profile.isRefetching}
            onRefresh={() => {
              void profile.refetch();
              void orders.refetch();
            }}
            tintColor={colors.terracotta}
          />
        }
      >
        <View style={styles.card}>
          {profile.isPending ? (
            <SkeletonBlock height={64} />
          ) : profile.isError ? (
            <ErrorView
              error={profile.error}
              onRetry={() => profile.refetch()}
              title="We couldn't load your profile"
            />
          ) : (
            <View style={styles.identity}>
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={styles.avatar}
                  accessibilityLabel="Profile photo"
                />
              ) : (
                <View style={[styles.avatar, styles.initials]}>
                  <AppText style={styles.initialsText}>{initials}</AppText>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <AppText variant="heading">
                  {name ?? "PrimeCoat customer"}
                </AppText>
                <AppText variant="small" numberOfLines={1}>
                  {email}
                </AppText>
              </View>
            </View>
          )}
          <View style={styles.facts}>
            <Fact label="Signed in with" value={provider} />
            <Fact
              label="Delivery state"
              value={profile.data?.deliveryState ?? "—"}
            />
            {user?.created_at ? (
              <Fact label="Member since" value={formatDate(user.created_at)} />
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={() => router.navigate("/orders")}
          style={({ pressed }) => [
            styles.link,
            pressed && { borderColor: colors.charcoal },
          ]}
          accessibilityRole="button"
        >
          <Package size={20} color={colors.terracotta} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium">Order history</AppText>
            <AppText variant="small">
              {orders.data
                ? `${orders.data.length} ${orders.data.length === 1 ? "order" : "orders"}`
                : "Loading…"}
            </AppText>
          </View>
          <ChevronRight size={18} color={colors.mute} />
        </Pressable>

        <Button
          variant="outline"
          size="lg"
          loading={signOut.isPending}
          icon={<LogOut size={16} color={colors.charcoal} />}
          onPress={() =>
            Alert.alert("Sign out?", "Your cart stays saved to your account.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign out",
                style: "destructive",
                onPress: () => signOut.mutate(),
              },
            ])
          }
        >
          Sign out
        </Button>
      </ScrollView>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}
    >
      <AppText variant="small">{label}</AppText>
      <AppText variant="bodyMedium" style={{ fontSize: 14 }}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.stone,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    padding: 18,
  },
  identity: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.stone,
  },
  initials: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.terracotta100,
  },
  initialsText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 20,
    color: colors.terracotta700,
  },
  facts: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.stone,
    gap: 10,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: colors.stone,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    padding: 16,
  },
});
