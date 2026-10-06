import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { absoluteImageUrl } from "@/lib/images";
import { queryKeys } from "@/lib/query-keys";
import { ORDER_STATUSES, type Order, type OrderSummary } from "@/types/order";

/** Same columns and validation as lib/orders/mappers.ts on the web. RLS returns only the owner's orders. */
const ORDER_COLUMNS =
  "id, order_number, customer_name, email, phone, delivery_address, city, state, delivery_instructions, subtotal, delivery_fee, total, status, payment_method, payment_status, confirmation_email_status, created_at";
const ORDER_ITEM_COLUMNS = "id, product_id, product_name, product_image_url, unit_price, quantity, subtotal";
const PAYMENT_COLUMNS = "reference, status, channel, paid_at, amount_kobo";

const itemRow = z.object({
  id: z.string(),
  product_id: z.string().nullable(),
  product_name: z.string(),
  product_image_url: z.string().nullable(),
  unit_price: z.coerce.number(),
  quantity: z.number().int(),
  subtotal: z.coerce.number(),
});

const paymentRow = z.object({
  reference: z.string(),
  status: z.string(),
  channel: z.string().nullable(),
  paid_at: z.string().nullable(),
  amount_kobo: z.coerce.number(),
});

const PAYMENT_METHODS = ["pay_on_delivery", "card", "bank_transfer"] as const;
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;

const orderRow = z.object({
  id: z.string(),
  order_number: z.string(),
  customer_name: z.string(),
  email: z.string(),
  phone: z.string(),
  delivery_address: z.string(),
  city: z.string(),
  state: z.string(),
  delivery_instructions: z.string().nullable(),
  subtotal: z.coerce.number(),
  delivery_fee: z.coerce.number(),
  total: z.coerce.number(),
  status: z.enum(ORDER_STATUSES),
  payment_method: z.enum(PAYMENT_METHODS),
  payment_status: z.enum(PAYMENT_STATUSES),
  confirmation_email_status: z.enum(["pending", "sent", "failed"]),
  created_at: z.string(),
  order_items: z.array(itemRow).default([]),
  payments: z.array(paymentRow).default([]),
});

const summaryRow = z.object({
  id: z.string(),
  order_number: z.string(),
  total: z.coerce.number(),
  status: z.enum(ORDER_STATUSES),
  payment_method: z.enum(PAYMENT_METHODS),
  payment_status: z.enum(PAYMENT_STATUSES),
  created_at: z.string(),
  order_items: z.array(z.object({ quantity: z.number().int() })).default([]),
});

function mapOrder(raw: unknown): Order {
  const r = orderRow.parse(raw);
  const paid = r.payments
    .filter((p) => p.status === "success")
    .sort((a, b) => (b.paid_at ?? "").localeCompare(a.paid_at ?? ""))[0];
  return {
    id: r.id,
    orderNumber: r.order_number,
    customerName: r.customer_name,
    email: r.email,
    phone: r.phone,
    deliveryAddress: r.delivery_address,
    city: r.city,
    state: r.state,
    deliveryInstructions: r.delivery_instructions,
    subtotal: r.subtotal,
    deliveryFee: r.delivery_fee,
    total: r.total,
    status: r.status,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    receipt: paid ? { reference: paid.reference, channel: paid.channel, paidAt: paid.paid_at, amount: paid.amount_kobo / 100 } : null,
    confirmationEmailStatus: r.confirmation_email_status,
    createdAt: r.created_at,
    items: r.order_items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      productName: i.product_name,
      productImageUrl: absoluteImageUrl(i.product_image_url),
      unitPrice: i.unit_price,
      quantity: i.quantity,
      subtotal: i.subtotal,
    })),
  };
}

export function useOrders(userId: string) {
  return useQuery({
    queryKey: queryKeys.orders.all(userId),
    queryFn: async (): Promise<OrderSummary[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, status, payment_method, payment_status, created_at, order_items(quantity)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((raw) => {
        const r = summaryRow.parse(raw);
        return {
          id: r.id,
          orderNumber: r.order_number,
          total: r.total,
          status: r.status,
          paymentMethod: r.payment_method,
          paymentStatus: r.payment_status,
          createdAt: r.created_at,
          itemCount: r.order_items.reduce((n, i) => n + i.quantity, 0),
        };
      });
    },
    enabled: Boolean(userId),
  });
}

export function useOrder(userId: string, orderId: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(userId, orderId),
    queryFn: async (): Promise<Order | null> => {
      const { data, error } = await supabase
        .from("orders")
        .select(`${ORDER_COLUMNS}, order_items(${ORDER_ITEM_COLUMNS}), payments(${PAYMENT_COLUMNS})`)
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapOrder(data) : null;
    },
    enabled: Boolean(userId && orderId),
  });
}
