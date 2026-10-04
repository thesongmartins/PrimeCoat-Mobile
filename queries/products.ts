import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { absoluteImageUrl } from "@/lib/images";
import { queryKeys, type ProductFilters } from "@/lib/query-keys";
import { PRODUCT_CATEGORIES, type Product } from "@/types/product";

/** Same columns and validation as lib/products/mappers.ts on the web. */
export const PRODUCT_COLUMNS =
  "id, name, slug, description, short_description, category, price, image_url, size, colour_name, colour_hex, finish, coverage, stock_quantity, is_featured";

const productRow = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  short_description: z.string(),
  category: z.enum(PRODUCT_CATEGORIES),
  price: z.coerce.number(),
  image_url: z.string(),
  size: z.string().nullable(),
  colour_name: z.string().nullable(),
  colour_hex: z.string().nullable(),
  finish: z.string().nullable(),
  coverage: z.string().nullable(),
  stock_quantity: z.number().int(),
  is_featured: z.boolean(),
});

export function mapProduct(raw: unknown): Product {
  const r = productRow.parse(raw);
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    shortDescription: r.short_description,
    category: r.category,
    price: r.price,
    imageUrl: absoluteImageUrl(r.image_url) ?? "",
    size: r.size,
    colourName: r.colour_name,
    colourHex: r.colour_hex,
    finish: r.finish,
    coverage: r.coverage,
    stockQuantity: r.stock_quantity,
    isFeatured: r.is_featured,
  };
}

function escapeLike(value: string) {
  return value.replace(/[%_\\]/g, (m) => `\\${m}`).replace(/[,()]/g, " ");
}

async function fetchProducts(filters: ProductFilters): Promise<Product[]> {
  let q = supabase.from("products").select(PRODUCT_COLUMNS).eq("is_active", true);
  const term = filters.query?.trim();
  if (term) {
    const like = `%${escapeLike(term)}%`;
    q = q.or(`name.ilike.${like},short_description.ilike.${like},colour_name.ilike.${like}`);
  }
  if (filters.category) q = q.eq("category", filters.category);
  // Default web ordering: featured first, then category, then name.
  const { data, error } = await q.order("is_featured", { ascending: false }).order("category").order("name");
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 5 * 60_000,
    placeholderData: (previous) => previous,
  });
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: queryKeys.products.featured(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("category")
        .order("name")
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(mapProduct);
    },
    staleTime: 5 * 60_000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("slug", slug).eq("is_active", true).maybeSingle();
      if (error) throw error;
      return data ? mapProduct(data) : null;
    },
    enabled: Boolean(slug),
    // Stock changes with every order, so product detail is fresher than lists.
    staleTime: 30_000,
  });
}
