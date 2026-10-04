import type { CartLine, CartTotals } from "@/types/cart";
import { roundMoney } from "./format";

/**
 * Delivery-fee estimate, mirrored from lib/cart/calculations.ts (web) and
 * calculate_delivery_fee() (SQL, the source of truth for stored orders).
 */
export const FREE_DELIVERY_THRESHOLD = 150_000;
export const DEFAULT_DELIVERY_STATE = "Lagos";
const SOUTH_WEST = new Set(["Ogun", "Oyo", "Osun", "Ondo", "Ekiti"]);

export function calculateDeliveryFee(subtotal: number, state: string | null | undefined): number {
  if (subtotal <= 0) return 0;
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  if (!state) return 7500;
  if (state === "Lagos") return 2500;
  if (SOUTH_WEST.has(state)) return 4000;
  if (state === "FCT Abuja") return 5000;
  return 7500;
}

export function lineSubtotal(line: Pick<CartLine, "price" | "quantity">): number {
  return roundMoney(line.price * line.quantity);
}

export function cartTotals(lines: ReadonlyArray<CartLine>, state: string | null | undefined): CartTotals {
  const subtotal = roundMoney(lines.reduce((sum, l) => sum + lineSubtotal(l), 0));
  const deliveryFee = calculateDeliveryFee(subtotal, state);
  return {
    subtotal,
    deliveryFee,
    total: roundMoney(subtotal + deliveryFee),
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
  };
}

/** Same bounds as cart_add_item(): at least 1, at most current stock and 999. */
export function clampQuantity(quantity: number, stockQuantity: number): number {
  return Math.max(1, Math.min(Math.floor(quantity), Math.max(stockQuantity, 1), 999));
}
