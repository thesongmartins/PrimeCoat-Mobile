import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  /** True until the stored session has been read from the keychain. */
  initializing: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, user: null, initializing: true });

/**
 * Holds the Supabase session (a client credential, not server data). When the signed-in user
 * changes or signs out, every cached query is dropped so one account never sees another's data.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ session: null, user: null, initializing: true });
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const apply = (session: Session | null) => {
      const nextId = session?.user.id ?? null;
      if (userIdRef.current !== nextId) {
        if (userIdRef.current !== null) queryClient.clear();
        userIdRef.current = nextId;
      }
      setState({ session, user: session?.user ?? null, initializing: false });
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** For screens inside the signed-in area. */
export function useUserId(): string {
  const { user } = useAuth();
  return user?.id ?? "";
}
