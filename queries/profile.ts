import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { DEFAULT_DELIVERY_STATE } from "@/lib/cart-calculations";
import type { Profile } from "@/types/profile";

/** public.profiles row (created by the handle_new_user trigger, shared with the web). */
export function useProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, phone, delivery_state")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id as string,
        fullName: (data.full_name as string | null) ?? null,
        email: (data.email as string | null) ?? null,
        avatarUrl: (data.avatar_url as string | null) ?? null,
        phone: (data.phone as string | null) ?? null,
        deliveryState: (data.delivery_state as string | null) ?? DEFAULT_DELIVERY_STATE,
      };
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}
