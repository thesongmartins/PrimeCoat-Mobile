import { useMutation } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";
import { completeOAuthFromUrl, oauthRedirectUrl } from "@/lib/auth";
import { AppError } from "@/lib/errors";

/**
 * Google sign-in through Supabase in the system browser (Custom Tabs / ASWebAuthenticationSession).
 * Same Supabase project and Google provider as the web, so the same Google account resolves to
 * the same Supabase user id — and therefore the same cart and orders.
 */
export function useGoogleSignIn() {
  return useMutation({
    mutationKey: ["auth", "google"],
    mutationFn: async () => {
      const redirectTo = oauthRedirectUrl();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
      });
      if (error || !data.url) throw new AppError("We couldn't start Google sign-in. Please try again.", "OAUTH_START");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === "success") return completeOAuthFromUrl(result.url);
      if (result.type === "cancel" || result.type === "dismiss") throw new AppError("Sign-in was cancelled.", "CANCELLED");
      throw new AppError("Google sign-in did not complete. Please try again.", "OAUTH_INCOMPLETE");
    },
  });
}

export function useEmailSignIn() {
  return useMutation({
    mutationKey: ["auth", "email"],
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (!error) return;
      if (/invalid login credentials/i.test(error.message)) throw new AppError("That email and password don't match an account.", "INVALID_CREDENTIALS");
      if (/email not confirmed/i.test(error.message)) throw new AppError("Please confirm your email first — check your inbox for the link.", "EMAIL_UNCONFIRMED");
      if (/network|fetch/i.test(error.message)) throw new AppError("You appear to be offline. Check your connection and try again.", "NETWORK");
      throw new AppError("We couldn't sign you in. Please try again.", "UNKNOWN");
    },
  });
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
