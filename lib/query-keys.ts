/** Every TanStack Query key in the app. Components never build keys by hand. */
export interface ProductFilters {
  query?: string;
  category?: string;
}

export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (filters: ProductFilters = {}) => ["products", "list", filters] as const,
    featured: () => ["products", "featured"] as const,
    detail: (slug: string) => ["products", "detail", slug] as const,
  },
  cart: (userId: string) => ["cart", userId] as const,
  orders: {
    all: (userId: string) => ["orders", userId] as const,
    detail: (userId: string, orderId: string) => ["orders", userId, orderId] as const,
  },
  profile: (userId: string) => ["profile", userId] as const,
};

/** Shared by every cart mutation: lets screens show "Syncing…" and serialises writes. */
export const CART_MUTATION_KEY = ["cart"] as const;
