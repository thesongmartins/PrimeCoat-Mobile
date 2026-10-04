/**
 * Public, bundled configuration. EXPO_PUBLIC_* values are inlined at build time, so they
 * must be referenced literally. Nothing secret belongs here: RLS protects the data.
 */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  /** PrimeCoat web origin: product images and POST /api/orders. */
  siteUrl: (process.env.EXPO_PUBLIC_SITE_URL ?? "https://primecoatt.vercel.app").replace(/\/+$/, ""),
};

export function isConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
