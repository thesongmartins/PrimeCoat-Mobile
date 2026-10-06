import { supabase } from "./supabase";
import { env } from "./env";
import { AppError } from "./errors";

/**
 * POSTs to the PrimeCoat website's API as the signed-in user. The Supabase access token goes in
 * `Authorization: Bearer`, and `X-PrimeCoat-Client: app` tells the website to send Paystack back
 * to the app (primecoat://payment-result) instead of its own pages.
 */
export async function postToSite<T>(
  path: string,
  body: unknown,
  messages: { offline: string; failed: string },
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AppError("Your session has expired. Please sign in again.", "AUTH_REQUIRED", 401);

  let res: Response;
  try {
    res = await fetch(`${env.siteUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-PrimeCoat-Client": "app",
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    throw new AppError(messages.offline, "NETWORK");
  }

  const json = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!res.ok) {
    const fallback = res.status >= 500 ? messages.failed : "Please check and try again.";
    throw new AppError(json.error ?? fallback, json.code ?? `HTTP_${res.status}`, res.status);
  }
  return json;
}
