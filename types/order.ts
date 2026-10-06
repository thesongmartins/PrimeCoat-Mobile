/** Mirrors types/order.ts in the web app. */
export const ORDER_STATUSES = ["pending", "confirmed", "processing", "out_for_delivery", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type PaymentMethod = "pay_on_delivery" | "card" | "bank_transfer";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pay_on_delivery: "Pay on Delivery",
  card: "Card",
  bank_transfer: "Bank transfer",
};

export type PaymentStatus = "unpaid" | "paid" | "refunded";

/** The successful Paystack payment for a card order (payments table, owner-only reads). */
export interface PaymentReceipt {
  reference: string;
  channel: string | null;
  paidAt: string | null;
  amount: number;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  city: string;
  state: string;
  deliveryInstructions: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Present once a card payment has been verified. */
  receipt: PaymentReceipt | null;
  confirmationEmailStatus: "pending" | "sent" | "failed";
  createdAt: string;
  items: OrderItem[];
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  itemCount: number;
  createdAt: string;
}

/** A card order that still needs paying (mirrors awaitingCard on the web). */
export function isAwaitingPayment(o: Pick<Order, "paymentMethod" | "paymentStatus" | "status">): boolean {
  return o.paymentMethod === "card" && o.paymentStatus === "unpaid" && o.status !== "cancelled";
}
