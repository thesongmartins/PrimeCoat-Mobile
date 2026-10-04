export interface CartLine {
  /** cart_items.id. "pending:<productId>" while an optimistic add is in flight. */
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  /** Current product price (NGN). The server re-prices at checkout. */
  price: number;
  imageUrl: string;
  size: string | null;
  colourName: string | null;
  colourHex: string | null;
  stockQuantity: number;
  quantity: number;
}

export interface Cart {
  lines: CartLine[];
  /** profiles.delivery_state, shared with the web cart. */
  deliveryState: string;
}

export interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}
