import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { completeOAuthFromUrl, oauthRedirectUrl } from "@/lib/auth";
import { toUserMessage } from "@/lib/errors";
import { LoadingView } from "@/components/ui/StatusViews";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

/**
 * primecoat://auth/callback — Android can open this route from the OAuth redirect as well as
 * returning it to openAuthSessionAsync. completeOAuthFromUrl() dedupes by code, so whichever
 * runs first exchanges it and the other simply waits for the same result.
 */
export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(oauthRedirectUrl());
    Object.entries(params).forEach(([k, v]) => typeof v === "string" && url.searchParams.set(k, v));
    completeOAuthFromUrl(url.toString())
      .then(() => router.replace("/"))
      .catch((e) => setError(toUserMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code, params.error]);

  if (!error) return <LoadingView label="Signing you in…" />;
  return (
    <View style={styles.wrap}>
      <AppText variant="heading" style={{ textAlign: "center" }}>Sign-in didn’t complete</AppText>
      <AppText variant="body" style={styles.msg}>{error}</AppText>
      <Button onPress={() => router.replace("/login")} style={{ marginTop: 20 }}>Back to sign in</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 32, backgroundColor: colors.warmWhite },
  msg: { textAlign: "center", marginTop: 8, color: colors.mute },
});
