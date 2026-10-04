import "./polyfills";
import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";
import { secureStorage } from "./secure-storage";

/**
 * The one Supabase client for the app: same project and anon key as the web.
 * Session persisted in the device keychain; RLS scopes every query to the signed-in user.
 */
export const supabase = createClient(env.supabaseUrl || "https://invalid.supabase.co", env.supabaseAnonKey || "missing", {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

// Refresh tokens only while the app is in the foreground (Supabase's React Native guidance).
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
