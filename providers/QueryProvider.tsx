import { useEffect, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { focusManager, MutationCache, onlineManager, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { isAuthError, isPermanentError } from "@/lib/errors";

// TanStack Query's "online" follows the device network state…
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected) && state.isInternetReachable !== false)),
);

// …and "focus" follows the app coming back to the foreground (refetches stale queries).
function useAppStateFocus() {
  useEffect(() => {
    const sub = AppState.addEventListener("change", (status) => {
      if (Platform.OS !== "web") focusManager.setFocused(status === "active");
    });
    return () => sub.remove();
  }, []);
}

/**
 * An expired or revoked session surfaces as 401/JWT errors from PostgREST. Try one refresh;
 * if that fails the session is gone, so sign out locally and the auth gate shows Login.
 */
let recovering: Promise<void> | null = null;
function recoverSession() {
  recovering ??= (async () => {
    const { error } = await supabase.auth.refreshSession();
    if (error) await supabase.auth.signOut({ scope: "local" });
  })().finally(() => {
    recovering = null;
  });
  return recovering;
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isAuthError(error)) void recoverSession();
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (isAuthError(error)) void recoverSession();
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        retry: (failureCount, error) => !isPermanentError(error) && failureCount < 2,
        refetchOnReconnect: true,
      },
      mutations: {
        // Cart and order writes are never retried blindly: a retried create_order could double-order.
        retry: 0,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  useAppStateFocus();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
