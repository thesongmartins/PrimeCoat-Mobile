import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEmailSignIn, useGoogleSignIn } from "@/mutations/auth";
import { AppError, toUserMessage } from "@/lib/errors";
import { isConfigured } from "@/lib/env";
import { colors, radii } from "@/constants/theme";
import { Logo } from "@/components/Logo";
import { GoogleMark } from "@/components/GoogleMark";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";
import { InlineError } from "@/components/ui/StatusViews";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const google = useGoogleSignIn();
  const emailSignIn = useEmailSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<TextInput>(null);

  const busy = google.isPending || emailSignIn.isPending;
  const googleError =
    google.error instanceof AppError && google.error.code === "CANCELLED"
      ? null
      : google.error;
  const error = googleError ?? emailSignIn.error;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        contentContainerStyle={[
          styles.wrap,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Logo size={34} />

        <View style={styles.intro}>
          <AppText variant="eyebrow">Welcome back</AppText>
          <AppText variant="title" style={{ marginTop: 10 }}>
            Sign in to PrimeCoat
          </AppText>
          <AppText variant="body" style={{ marginTop: 8 }}>
            Sign in to your account to view your orders, manage your profile,
            and access exclusive features.
          </AppText>
        </View>

        <View style={styles.card}>
          <Button
            variant="outline"
            size="lg"
            onPress={() => google.mutate()}
            loading={google.isPending}
            disabled={busy || !isConfigured()}
            icon={<GoogleMark />}
          >
            Continue with Google
          </Button>

          <View style={styles.divider}>
            <View style={styles.rule} />
            <AppText variant="small">or with email</AppText>
            <View style={styles.rule} />
          </View>

          <View style={{ gap: 14 }}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <PasswordField
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={setPassword}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => emailSignIn.mutate({ email, password })}
            />
            <Button
              size="lg"
              onPress={() => emailSignIn.mutate({ email, password })}
              loading={emailSignIn.isPending}
              disabled={busy || !email || !password}
            >
              Sign in
            </Button>
          </View>

          {error ? (
            <View style={{ marginTop: 16 }}>
              <InlineError message={toUserMessage(error)} />
            </View>
          ) : null}
          {!isConfigured() && (
            <View style={{ marginTop: 16 }}>
              <InlineError message="Sign-in isn't configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env." />
            </View>
          )}
        </View>

        <AppText variant="small" style={styles.footnote}>
          By signing in, you agree to our{" "}
          <AppText
            variant="small"
            style={{ textDecorationLine: "underline" }}
            // onPress={() => router.navigate("/terms")}
          >
            Terms of Service
          </AppText>{" "}
          and{" "}
          <AppText
            variant="small"
            style={{ textDecorationLine: "underline" }}
            // onPress={() => router.navigate("/privacy")}
          >
            Privacy Policy
          </AppText>
          .
        </AppText>
        <AppText variant="small" style={styles.footnote}>
          Don’t have an account?{" "}
          <AppText
            variant="small"
            style={{ textDecorationLine: "underline" }}
            onPress={() => router.push("/signup")}
            accessibilityRole="link"
          >
            Sign up
          </AppText>
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    paddingHorizontal: 20,
    backgroundColor: colors.warmWhite,
  },
  intro: { marginTop: 40 },
  card: {
    marginTop: 28,
    padding: 20,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.stone,
    backgroundColor: colors.white,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
  },
  rule: { flex: 1, height: 1, backgroundColor: colors.stone },
  footnote: { marginTop: 24, textAlign: "center" },
});
