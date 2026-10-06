import { useMutation } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import type { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { completeOAuthFromUrl, oauthRedirectUrl } from "@/lib/auth";
import type { SignUpInput } from "@/lib/auth-schema";
import { AppError } from "@/lib/errors";

export function useGoogleSignIn() {
  return useMutation({
    mutationKey: ["auth", "google"],
    mutationFn: async () => {
      const redirectTo = oauthRedirectUrl();
      // Expo Go can only return to exp://<host>:<port>, which Supabase doesn't allow, so Google
      // would finish on the website. Say so instead of leaving the user stranded there.
      if (redirectTo.startsWith("exp://"))
        throw new AppError(
          "Google sign-in doesn't work in Expo Go. Open the PrimeCoat app instead, or sign in with email.",
          "EXPO_GO",
        );
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error || !data.url)
        throw new AppError(
          "We couldn't start Google sign-in. Please try again.",
          "OAUTH_START",
        );

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );
      if (result.type === "success") return completeOAuthFromUrl(result.url);
      if (result.type === "cancel" || result.type === "dismiss")
        throw new AppError("Sign-in was cancelled.", "CANCELLED");
      throw new AppError(
        "Google sign-in did not complete. Please try again.",
        "OAUTH_INCOMPLETE",
      );
    },
  });
}

export function useEmailSignIn() {
  return useMutation({
    mutationKey: ["auth", "email"],
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (!error) return;
      if (/invalid login credentials/i.test(error.message))
        throw new AppError(
          "That email and password don't match an account.",
          "INVALID_CREDENTIALS",
        );
      if (/email not confirmed/i.test(error.message))
        throw new AppError(
          "Please confirm your email first — check your inbox for the link.",
          "EMAIL_UNCONFIRMED",
        );
      if (/network|fetch/i.test(error.message))
        throw new AppError(
          "You appear to be offline. Check your connection and try again.",
          "NETWORK",
        );
      throw new AppError(
        "We couldn't sign you in. Please try again.",
        "UNKNOWN",
      );
    },
  });
}

export type SignUpResult =
  | { status: "signed_in" }
  | { status: "check_email"; email: string };

/**
 * Email sign-up, same as signUpWithPassword() on the web. The confirmation link returns to
 * primecoat://auth/callback, where app/auth/callback exchanges its code for a session.
 */
export function useEmailSignUp() {
  return useMutation({
    mutationKey: ["auth", "signUp"],
    mutationFn: async (input: SignUpInput): Promise<SignUpResult> => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { full_name: input.fullName },
          emailRedirectTo: oauthRedirectUrl(),
        },
      });
      if (error) throw signUpError(error);
      // Confirmation disabled in Supabase: already signed in, and the auth gate shows the tabs.
      if (data.session) return { status: "signed_in" };
      // Confirmation enabled (or the email is already registered — Supabase hides which).
      return { status: "check_email", email: input.email };
    },
  });
}

export function useResendConfirmation() {
  return useMutation({
    mutationKey: ["auth", "resend"],
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: oauthRedirectUrl() },
      });
      if (error?.status === 429)
        throw new AppError(
          "Please wait a minute before requesting another email.",
          "RATE_LIMITED",
          429,
        );
      if (error)
        throw new AppError(
          "We couldn't resend the email. Please try again.",
          "UNKNOWN",
        );
    },
  });
}

function signUpError(error: AuthError): AppError {
  if (error.code === "user_already_exists")
    return new AppError(
      "An account with this email already exists. Sign in instead.",
      "USER_EXISTS",
    );
  if (error.code === "weak_password")
    return new AppError("Choose a stronger password.", "WEAK_PASSWORD");
  if (error.code === "email_address_invalid")
    return new AppError(
      "That email address can't receive mail. Please use a real address.",
      "EMAIL_INVALID",
    );
  if (
    error.code === "email_address_not_authorized" ||
    /sending .*email/i.test(error.message)
  )
    return new AppError(
      "We couldn't send your confirmation email. Please try again later or continue with Google.",
      "EMAIL_NOT_SENT",
    );
  if (error.status === 429)
    return new AppError(
      "Too many sign-up attempts. Please wait a few minutes.",
      "RATE_LIMITED",
      429,
    );
  if (/network|fetch/i.test(error.message))
    return new AppError(
      "You appear to be offline. Check your connection and try again.",
      "NETWORK",
    );
  return new AppError(
    "We couldn't create your account right now. Please try again.",
    "UNKNOWN",
  );
}

export function useSignOut() {
  return useMutation({
    mutationKey: ["auth", "signOut"],
    // Local sign-out always succeeds, even offline; AuthProvider then clears every cached query.
    mutationFn: async () => {
      await supabase.auth.signOut({ scope: "local" });
    },
  });
}
