import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { absoluteImageUrl } from "@/lib/images";
import { queryKeys } from "@/lib/query-keys";
import { DEFAULT_DELIVERY_STATE } from "@/lib/cart-calculations";
import { isNigeriaState } from "@/constants/nigeria-states";
import type { Cart, CartLine } from "@/types/cart";

/**
 * The signed-in user's cart, read from the existing public.cart_items table (the same rows the
 * web cart shows), priced from the current product rows. RLS limits rows to auth.uid().
 * Mirrors lib/cart/queries.ts on the web.
 */
const CART_SELECT = "id, quantity, product:products(id, slug, name, price, image_url, size, colour_name, colour_hex, stock_quantity)";

const cartRow = z.object({
  id: z.string(),
  quantity: z.number().int(),
  product: z
    .object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      price: z.coerce.number(),
      image_url: z.string(),
      size: z.string().nullable(),
      colour_name: z.string().nullable(),
      colour_hex: z.string().nullable(),
      stock_quantity: z.number().int(),
    })
    .nullable(),
});

export async function fetchCart(userId: string): Promise<Cart> {
  const [cartRes, profileRes] = await Promise.all([
    supabase.from("cart_items").select(CART_SELECT).order("created_at", { ascending: true }),
    supabase.from("profiles").select("delivery_state").eq("id", userId).maybeSingle(),
  ]);
  if (cartRes.error) throw cartRes.error;

  const lines: CartLine[] = [];
  for (const raw of cartRes.data ?? []) {
    const row = cartRow.parse(raw);
    // Deactivated products are hidden by RLS and come back null: skip them, as the web does.
    if (!row.product) continue;
    const p = row.product;
    lines.push({
      lineId: row.id,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      imageUrl: absoluteImageUrl(p.image_url) ?? "",
      size: p.size,
      colourName: p.colour_name,
      colourHex: p.colour_hex,
      stockQuantity: p.stock_quantity,
      quantity: row.quantity,
    });
  }

  const saved = profileRes.data?.delivery_state;
  return { lines, deliveryState: saved && isNigeriaState(saved) ? saved : DEFAULT_DELIVERY_STATE };
}

export function useCart(userId: string) {
  return useQuery({
    queryKey: queryKeys.cart(userId),
    queryFn: () => fetchCart(userId),
    enabled: Boolean(userId),
    // Realtime invalidates this the moment another device changes the cart.
    staleTime: 60_000,
  });
}

export function useCartCount(userId: string): number {
  const { data } = useCart(userId);
  return data?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0;
}
