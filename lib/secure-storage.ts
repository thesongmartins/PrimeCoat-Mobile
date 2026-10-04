import * as SecureStore from "expo-secure-store";

/**
 * Supabase session storage backed by the device keychain/keystore (expo-secure-store).
 * SecureStore values are limited to ~2 KB and a Supabase session is larger, so values
 * are split into chunks: `<key>.n` holds the count, `<key>.0..n-1` the parts.
 */
const CHUNK = 1800;

const countKey = (key: string) => `${key}.n`;
const partKey = (key: string, i: number) => `${key}.${i}`;

async function removeParts(key: string) {
  const n = Number((await SecureStore.getItemAsync(countKey(key))) ?? 0);
  await Promise.all(Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(partKey(key, i))));
  await SecureStore.deleteItemAsync(countKey(key));
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const n = await SecureStore.getItemAsync(countKey(key));
    if (n === null) return null;
    const parts = await Promise.all(Array.from({ length: Number(n) }, (_, i) => SecureStore.getItemAsync(partKey(key, i))));
    if (parts.some((p) => p === null)) return null;
    return parts.join("");
  },
  async setItem(key: string, value: string): Promise<void> {
    await removeParts(key);
    const parts = value.match(new RegExp(`[\\s\\S]{1,${CHUNK}}`, "g")) ?? [""];
    await Promise.all(parts.map((p, i) => SecureStore.setItemAsync(partKey(key, i), p)));
    await SecureStore.setItemAsync(countKey(key), String(parts.length));
  },
  async removeItem(key: string): Promise<void> {
    await removeParts(key);
  },
};
