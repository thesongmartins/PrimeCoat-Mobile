import { useEffect } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { CART_MUTATION_KEY, queryKeys } from "@/lib/query-keys";
import { isOwnCartEvent } from "@/lib/cart-realtime";
import type { Cart } from "@/types/cart";

/**
 * Cross-device cart sync. Mount ONCE, in the signed-in layout.
 *
 *   other device writes cart_items → Supabase Realtime → this hook
 *     → invalidate ['cart', userId] → TanStack Query refetches → screens re-render
 *
 * Realtime is a change signal, not a second store: a cart_items row has no name or price,
 * so the cart is always re-read through the same query the screens use.
 *
 * - One channel per user; removed on unmount, sign-out and user change (effect keyed on userId).
 * - Bursts (e.g. create_order deleting every line) collapse into one refetch.
 * - While a local cart write is pending its own onSettled refetches, so events are not applied
 *   on top of optimistic state (no flicker, no loops: refetching never writes).
 * - After a dropped connection the cart is refetched once, to catch anything missed.
 * - Returning to the foreground refetches too: Android pauses the socket in the background, so an
 *   order placed on the web meanwhile would otherwise stay invisible until the cache went stale.
 */
export function useCartRealtime(userId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const key = queryKeys.cart(userId);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let missedEvents = false;

    const scheduleRefetch = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (queryClient.isMutating({ mutationKey: CART_MUTATION_KEY }) > 0)
          return;
        void queryClient.invalidateQueries({ queryKey: key });
      }, 200);
    };

    const onChange = (
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) => {
      const event = {
        eventType: payload.eventType,
        new: payload.new as Record<string, unknown>,
        old: payload.old as Record<string, unknown>,
      };
      if (isOwnCartEvent(event, userId, queryClient.getQueryData<Cart>(key)))
        scheduleRefetch();
    };

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    let wasBackground = false;
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "background") wasBackground = true;
      else if (state === "active" && wasBackground) {
        wasBackground = false;
        scheduleRefetch();
      }
    });

    // A session restored from the keychain never fires SIGNED_IN, so supabase-js would join with the
    // anon key and RLS would drop every event. Give Realtime the user's JWT before subscribing.
    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      channel = supabase
        .channel(`cart:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cart_items",
            filter: `user_id=eq.${userId}`,
          },
          onChange,
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "cart_items" },
          onChange,
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            if (missedEvents) {
              missedEvents = false;
              scheduleRefetch();
            }
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            missedEvents = true;
          }
        });
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      appState.remove();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
