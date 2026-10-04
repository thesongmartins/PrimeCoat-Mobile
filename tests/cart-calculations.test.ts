/// <reference types="node" />
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateDeliveryFee, cartTotals, clampQuantity } from "../lib/cart-calculations";
import { formatNaira } from "../lib/format";
import type { CartLine } from "../types/cart";

const line = (price: number, quantity: number): CartLine => ({
  lineId: "l", productId: "p", slug: "s", name: "n", price, imageUrl: "", size: null, colourName: null, colourHex: null, stockQuantity: 99, quantity,
});

test("delivery fee matches calculate_delivery_fee() in SQL", () => {
  assert.equal(calculateDeliveryFee(0, "Lagos"), 0);
  assert.equal(calculateDeliveryFee(10_000, "Lagos"), 2500);
  assert.equal(calculateDeliveryFee(10_000, "Oyo"), 4000);
  assert.equal(calculateDeliveryFee(10_000, "FCT Abuja"), 5000);
  assert.equal(calculateDeliveryFee(10_000, "Kano"), 7500);
  assert.equal(calculateDeliveryFee(150_000, "Kano"), 0);
});

test("totals: the web's verified example (2 × ₦18,500 to Kano = ₦44,500)", () => {
  const t = cartTotals([line(18_500, 2)], "Kano");
  assert.deepEqual(t, { subtotal: 37_000, deliveryFee: 7_500, total: 44_500, itemCount: 2 });
});

test("quantity is clamped like cart_add_item(): 1..stock, max 999", () => {
  assert.equal(clampQuantity(0, 10), 1);
  assert.equal(clampQuantity(12, 10), 10);
  assert.equal(clampQuantity(5000, 5000), 999);
});

test("formatNaira matches the web format", () => {
  assert.equal(formatNaira(12500), "₦12,500");
  assert.equal(formatNaira(1234567.5), "₦1,234,567.50");
  assert.equal(formatNaira(0), "₦0");
});
