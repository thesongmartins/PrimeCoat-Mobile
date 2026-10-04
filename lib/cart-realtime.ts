import type { Cart } from "@/types/cart";

/**
 * Decides whether a cart_items Realtime event concerns this user's cart. Pure, unit-tested.
 * - INSERT/UPDATE arrive pre-filtered by `user_id=eq.<uid>` and RLS; we still check the row.
 * - DELETE cannot be filtered and arrives for every user carrying only `{ id }`, so it counts
 *   only when the id is one of our cached lines. (Verified against the live project.)
 */
export function isOwnCartEvent(
  event: { eventType: string; new?: Record<string, unknown> | null; old?: Record<string, unknown> | null },
  userId: string,
  cart: Cart | undefined,
): boolean {
  if (event.eventType === "INSERT" || event.eventType === "UPDATE") {
    return event.new?.user_id === userId;
  }
  if (event.eventType === "DELETE") {
    const id = event.old?.id;
    if (typeof id !== "string") return false;
    if (event.old?.user_id !== undefined) return event.old.user_id === userId;
    return Boolean(cart?.lines.some((l) => l.lineId === id));
  }
  return false;
}
