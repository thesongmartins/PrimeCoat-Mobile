/**
 * Runtime gaps Supabase needs on React Native:
 * - a spec-complete URL/URLSearchParams
 * - crypto.getRandomValues + crypto.subtle.digest so Supabase Auth can use PKCE with S256
 */
import "react-native-url-polyfill/auto";
import * as ExpoCrypto from "expo-crypto";

type CryptoLike = {
  getRandomValues?: <T extends ArrayBufferView | null>(array: T) => T;
  subtle?: { digest?: (algorithm: string, data: BufferSource) => Promise<ArrayBuffer> };
};

const g = globalThis as unknown as { crypto?: CryptoLike };
const c: CryptoLike = g.crypto ?? {};

if (typeof c.getRandomValues !== "function") {
  c.getRandomValues = ((array: Parameters<typeof ExpoCrypto.getRandomValues>[0]) =>
    ExpoCrypto.getRandomValues(array)) as CryptoLike["getRandomValues"];
}
if (!c.subtle || typeof c.subtle.digest !== "function") {
  c.subtle = {
    ...(c.subtle ?? {}),
    digest: (_algorithm, data) =>
      ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, data as ArrayBuffer | ArrayBufferView as never),
  };
}
g.crypto = c;
