/**
 * Where the website sends the in-app browser after Paystack (see app/payments/paystack/app-callback
 * on the web): primecoat://payment-result?orderId=…&status=success|pending|failed|cancelled.
 * The status only picks the wording; the order screen always re-reads whether the order is paid.
 */
export const PAYMENT_RETURN_URL = "primecoat://payment-result";

export const PAYMENT_OUTCOMES = ["success", "pending", "failed", "cancelled"] as const;
export type PaymentOutcome = (typeof PAYMENT_OUTCOMES)[number];

export interface PaymentReturn {
  orderId: string | null;
  status: PaymentOutcome;
}

const ORDER_ID = /^[0-9a-f-]{36}$/i;

export function toPaymentOutcome(value: unknown): PaymentOutcome {
  return PAYMENT_OUTCOMES.includes(value as PaymentOutcome) ? (value as PaymentOutcome) : "pending";
}

/** Reads the return URL. Unknown or missing values never claim success. */
export function parsePaymentReturn(url: string): PaymentReturn {
  let params: URLSearchParams;
  try {
    params = new URL(url).searchParams;
  } catch {
    return { orderId: null, status: "pending" };
  }
  const orderId = params.get("orderId");
  return { orderId: orderId && ORDER_ID.test(orderId) ? orderId : null, status: toPaymentOutcome(params.get("status")) };
}
