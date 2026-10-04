/// <reference types="node" />
import { test } from "node:test";
import assert from "node:assert/strict";
import { isOwnCartEvent } from "../lib/cart-realtime";
import type { Cart } from "../types/cart";

const me = "user-a";
const cart: Cart = {
  deliveryState: "Lagos",
  lines: [{ lineId: "line-1", productId: "p1", slug: "s", name: "Paint", price: 1, imageUrl: "", size: null, colourName: null, colourHex: null, stockQuantity: 5, quantity: 1 }],
};

test("INSERT/UPDATE count only for the signed-in user's rows", () => {
  assert.equal(isOwnCartEvent({ eventType: "INSERT", new: { user_id: me } }, me, cart), true);
  assert.equal(isOwnCartEvent({ eventType: "UPDATE", new: { user_id: me } }, me, cart), true);
  assert.equal(isOwnCartEvent({ eventType: "UPDATE", new: { user_id: "user-b" } }, me, cart), false);
});

test("DELETE with only an id counts when the id is one of our lines", () => {
  assert.equal(isOwnCartEvent({ eventType: "DELETE", old: { id: "line-1" } }, me, cart), true);
});

test("DELETE of another user's row (only id visible) is ignored", () => {
  assert.equal(isOwnCartEvent({ eventType: "DELETE", old: { id: "someone-elses-line" } }, me, cart), false);
});

test("DELETE carrying user_id is decided by user_id", () => {
  assert.equal(isOwnCartEvent({ eventType: "DELETE", old: { id: "x", user_id: me } }, me, cart), true);
  assert.equal(isOwnCartEvent({ eventType: "DELETE", old: { id: "line-1", user_id: "user-b" } }, me, cart), false);
});

test("DELETE before the cart is cached is ignored (the first fetch is already fresh)", () => {
  assert.equal(isOwnCartEvent({ eventType: "DELETE", old: { id: "line-1" } }, me, undefined), false);
});
