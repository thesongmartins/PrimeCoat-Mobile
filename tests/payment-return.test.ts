/// <reference types="node" />
import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePaymentReturn, toPaymentOutcome } from "../lib/payment-return";
import { checkoutSchema } from "../lib/checkout-schema";
import { isAwaitingPayment } from "../types/order";

const id = "3f0c9a52-6a1e-4c1b-9f53-2d6b1f7e8a10";

test("reads the order and outcome the website sends back", () => {
  assert.deepEqual(parsePaymentReturn(`primecoat://payment-result?orderId=${id}&status=success`), { orderId: id, status: "success" });
  assert.deepEqual(parsePaymentReturn(`primecoat://payment-result?orderId=${id}&status=cancelled`), { orderId: id, status: "cancelled" });
  // Next.js normalises the redirect to payment-result/?… — same meaning.
  assert.deepEqual(parsePaymentReturn(`primecoat://payment-result/?orderId=${id}&status=success`), { orderId: id, status: "success" });
});

test("never claims success for unknown or missing values", () => {
  assert.equal(parsePaymentReturn("primecoat://payment-result?status=paid-ish").status, "pending");
  assert.equal(parsePaymentReturn("primecoat://payment-result").status, "pending");
  assert.equal(parsePaymentReturn("not a url").status, "pending");
  assert.equal(toPaymentOutcome(undefined), "pending");
});

test("ignores an order id that isn't a UUID", () => {
  assert.equal(parsePaymentReturn("primecoat://payment-result?orderId=../../etc&status=success").orderId, null);
});

test("checkout defaults to pay on delivery and accepts card", () => {
  const base = { fullName: "Ada Obi", email: "ada@example.com", phone: "08031234567", deliveryAddress: "14 Bourdillon Road", city: "Lagos", state: "Lagos" };
  assert.equal(checkoutSchema.parse(base).paymentMethod, "pay_on_delivery");
  assert.equal(checkoutSchema.parse({ ...base, paymentMethod: "card" }).paymentMethod, "card");
  assert.equal(checkoutSchema.safeParse({ ...base, paymentMethod: "bitcoin" }).success, false);
});

test("only unpaid, uncancelled card orders are awaiting payment", () => {
  assert.equal(isAwaitingPayment({ paymentMethod: "card", paymentStatus: "unpaid", status: "pending" }), true);
  assert.equal(isAwaitingPayment({ paymentMethod: "card", paymentStatus: "paid", status: "confirmed" }), false);
  assert.equal(isAwaitingPayment({ paymentMethod: "card", paymentStatus: "unpaid", status: "cancelled" }), false);
  assert.equal(isAwaitingPayment({ paymentMethod: "pay_on_delivery", paymentStatus: "unpaid", status: "pending" }), false);
});
