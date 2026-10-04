import * as Linking from "expo-linking";
import { supabase } from "./supabase";
import { AppError } from "./errors";

/** primecoat://auth/callback in a development or release build. Must be in Supabase's Redirect URLs. */
export function oauthRedirectUrl(): string {
  return Linking.createURL("auth/callback");
}

const exchanges = new Map<string, Promise<void>>();

/**
 * Completes Supabase OAuth (PKCE) from the redirect URL. Android can deliver the same redirect
 * twice (auth-session result and deep link); a code can only be exchanged once, so dedupe.
 */
export function completeOAuthFromUrl(url: string): Promise<void> {
  const parsed = new URL(url);
  const params = new URLSearchParams(parsed.search);
  // Implicit-style errors may come back in the fragment.
  new URLSearchParams(parsed.hash.replace(/^#/, "")).forEach((v, k) => params.set(k, v));

  const errorDescription = params.get("error_description") ?? params.get("error");
  if (errorDescription) {
    return Promise.reject(new AppError(`Google sign-in failed: ${errorDescription.replace(/\+/g, " ")}`, "OAUTH_ERROR"));
  }
  const code = params.get("code");
  if (!code) return Promise.reject(new AppError("Google sign-in did not return a code. Please try again.", "OAUTH_NO_CODE"));

  let pending = exchanges.get(code);
  if (!pending) {
    pending = supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) throw new AppError("We couldn't complete Google sign-in. Please try again.", "OAUTH_EXCHANGE");
    });
    exchanges.set(code, pending);
  }
  return pending;
}
