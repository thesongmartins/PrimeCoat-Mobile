import { useRef, useState } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MailCheck } from "lucide-react-native";
import { z } from "zod";
import { useEmailSignUp, useGoogleSignIn, useResendConfirmation } from "@/mutations/auth";
import { PASSWORD_MIN, signUpSchema, type SignUpInput } from "@/lib/auth-schema";
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

type Field = keyof SignUpInput;
const EMPTY: SignUpInput = { fullName: "", email: "", password: "", confirmPassword: "" };

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const google = useGoogleSignIn();
  const signUp = useEmailSignUp();
  const [values, setValues] = useState<SignUpInput>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const set = (field: Field) => (text: string) => {
    setValues((v) => ({ ...v, [field]: text }));
    if (fieldErrors[field]) setFieldErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = () => {
    const parsed = signUpSchema.safeParse(values);
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      setFieldErrors(Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v?.[0]])));
      return;
    }
    setFieldErrors({});
    signUp.mutate(parsed.data);
  };

  // Signed in straight away: the auth gate in app/_layout.tsx swaps this screen for the tabs.
  if (signUp.data?.status === "check_email") return <CheckEmail email={signUp.data.email} />;

  const busy = google.isPending || signUp.isPending;
  const googleError = google.error instanceof AppError && google.error.code === "CANCELLED" ? null : google.error;
  const error = googleError ?? signUp.error;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Logo size={34} />

        <View style={styles.intro}>
          <AppText variant="eyebrow">Create account</AppText>
          <AppText variant="title" style={{ marginTop: 10 }}>Join PrimeCoat</AppText>
          <AppText variant="body" style={{ marginTop: 8 }}>
            One account for the app and the website — the same cart, orders and profile on both.
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
              label="Full name"
              value={values.fullName}
              onChangeText={set("fullName")}
              error={fieldErrors.fullName}
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            <TextField
              ref={emailRef}
              label="Email"
              value={values.email}
              onChangeText={set("email")}
              error={fieldErrors.email}
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
              value={values.password}
              onChangeText={set("password")}
              error={fieldErrors.password}
              hint={`At least ${PASSWORD_MIN} characters, with a letter and a number.`}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <PasswordField
              ref={confirmRef}
              label="Confirm password"
              value={values.confirmPassword}
              onChangeText={set("confirmPassword")}
              error={fieldErrors.confirmPassword}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            <Button size="lg" onPress={submit} loading={signUp.isPending} disabled={busy || !isConfigured()}>
              Create account
            </Button>
          </View>

          {error ? (
            <View style={{ marginTop: 16 }}>
              <InlineError message={toUserMessage(error)} />
            </View>
          ) : null}
        </View>

        <AppText variant="small" style={styles.footnote}>
          Already have an account?{" "}
          <AppText variant="small" style={styles.link} onPress={backToLogin} accessibilityRole="link">
            Sign in
          </AppText>
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CheckEmail({ email }: { email: string }) {
  const insets = useSafeAreaInsets();
  const resend = useResendConfirmation();

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
      <Logo size={34} />
      <View style={[styles.card, { marginTop: 40 }]}>
        <MailCheck size={32} color={colors.terracotta} />
        <AppText variant="heading" style={{ marginTop: 12 }}>Check your email</AppText>
        <AppText variant="body" style={{ marginTop: 8 }}>
          We’ve sent a confirmation link to <AppText variant="bodyMedium">{email}</AppText>. Open it to
          activate your account, then sign in here with your email and password.
        </AppText>
        <AppText variant="small" style={{ marginTop: 12 }}>Can’t find it? Check spam, or</AppText>
        <Button
          variant="outline"
          size="sm"
          onPress={() => resend.mutate(email)}
          loading={resend.isPending}
          style={{ marginTop: 8, alignSelf: "flex-start" }}
        >
          Resend the link
        </Button>
        {resend.isSuccess ? (
          <AppText variant="small" style={{ marginTop: 10 }} accessibilityLiveRegion="polite">
            A new link is on its way.
          </AppText>
        ) : null}
        {resend.error ? (
          <View style={{ marginTop: 10 }}>
            <InlineError message={toUserMessage(resend.error)} />
          </View>
        ) : null}
      </View>
      <Button variant="ghost" onPress={backToLogin} style={{ marginTop: 20 }}>
        Back to sign in
      </Button>
    </ScrollView>
  );
}

function backToLogin() {
  if (router.canGoBack()) router.back();
  else router.replace("/login");
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, paddingHorizontal: 20, backgroundColor: colors.warmWhite },
  intro: { marginTop: 40 },
  card: {
    marginTop: 28,
    padding: 20,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.stone,
    backgroundColor: colors.white,
  },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  rule: { flex: 1, height: 1, backgroundColor: colors.stone },
  footnote: { marginTop: 24, textAlign: "center" },
  link: { textDecorationLine: "underline", color: colors.charcoal },
});
