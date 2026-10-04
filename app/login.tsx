import { useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Eye, EyeOff } from "lucide-react-native";
import { useEmailSignIn, useGoogleSignIn } from "@/mutations/auth";
import { AppError, toUserMessage } from "@/lib/errors";
import { isConfigured } from "@/lib/env";
import { colors, radii } from "@/constants/theme";
import { Logo } from "@/components/Logo";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { InlineError } from "@/components/ui/StatusViews";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const google = useGoogleSignIn();
  const emailSignIn = useEmailSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const busy = google.isPending || emailSignIn.isPending;
  const googleError = google.error instanceof AppError && google.error.code === "CANCELLED" ? null : google.error;
  const error = googleError ?? emailSignIn.error;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Logo size={34} />

        <View style={styles.intro}>
          <AppText variant="eyebrow">Welcome back</AppText>
          <AppText variant="title" style={{ marginTop: 10 }}>Sign in to PrimeCoat</AppText>
          <AppText variant="body" style={{ marginTop: 8 }}>
            Your cart and orders follow your account, so anything you add on the website is here too.
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
            <View>
              <TextField
                ref={passwordRef}
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => emailSignIn.mutate({ email, password })}
                style={{ paddingRight: 48 }}
              />
              <Pressable
                onPress={() => setShowPassword((s) => !s)}
                style={styles.eye}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} color={colors.mute} /> : <Eye size={18} color={colors.mute} />}
              </Pressable>
            </View>
            <Button
              size="lg"
              onPress={() => emailSignIn.mutate({ email, password })}
              loading={emailSignIn.isPending}
              disabled={busy || !email || !password}
            >
              Sign in
            </Button>
          </View>

          {error ? <View style={{ marginTop: 16 }}><InlineError message={toUserMessage(error)} /></View> : null}
          {!isConfigured() && (
            <View style={{ marginTop: 16 }}>
              <InlineError message="Sign-in isn't configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env." />
            </View>
          )}
        </View>

        <AppText variant="small" style={styles.footnote}>
          New to PrimeCoat? Continue with Google, or create an email account on primecoatt.vercel.app.
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function GoogleMark() {
  return (
    <Svg viewBox="0 0 48 48" width={18} height={18}>
      <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.2z" />
      <Path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.1z" />
      <Path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.8 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, paddingHorizontal: 20, backgroundColor: colors.warmWhite },
  intro: { marginTop: 40 },
  card: { marginTop: 28, padding: 20, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.stone, backgroundColor: colors.white },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  rule: { flex: 1, height: 1, backgroundColor: colors.stone },
  eye: { position: "absolute", right: 14, bottom: 14 },
  footnote: { marginTop: 24, textAlign: "center" },
});
