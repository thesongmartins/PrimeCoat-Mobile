/** Mirrors types/product.ts in the web app. */
export const PRODUCT_CATEGORIES = [
  "interior", "exterior", "ceiling", "primer", "gloss", "textured",
  "wood_finish", "metal_finish", "accessories", "tools",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  interior: "Interior",
  exterior: "Exterior",
  ceiling: "Ceiling",
  primer: "Primer",
  gloss: "Gloss",
  textured: "Textured",
  wood_finish: "Wood Finish",
  metal_finish: "Metal Finish",
  accessories: "Accessories",
  tools: "Tools",
};

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: ProductCategory;
  /** Price in NGN. */
  price: number;
  /** Absolute URL (the database stores a path on the web origin). */
  imageUrl: string;
  size: string | null;
  colourName: string | null;
  colourHex: string | null;
  finish: string | null;
  coverage: string | null;
  stockQuantity: number;
  isFeatured: boolean;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export function getStockStatus(stockQuantity: number): StockStatus {
  if (stockQuantity <= 0) return "out_of_stock";
  if (stockQuantity <= 5) return "low_stock";
  return "in_stock";
}
