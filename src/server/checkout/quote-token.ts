import { createHmac } from "node:crypto";

export type QuotePayload = {
  productSlug: string;
  payment: string;
  totalIdr: string;
  expiresAt: number;
};

export function signQuote(payload: Omit<QuotePayload, "expiresAt">): {
  token: string;
  expiresAt: number;
} {
  // 15 minutes expiry
  const expiresAt = Date.now() + 15 * 60 * 1000;
  const data = `${payload.productSlug}:${payload.payment}:${payload.totalIdr}:${expiresAt}`;

  const hmac = createHmac(
    "sha256",
    Buffer.from(process.env.QUOTE_HMAC_KEY || "", "hex"),
  );
  hmac.update(data, "utf8");
  const signature = hmac.digest("base64url");

  const token = `${Buffer.from(data, "utf8").toString("base64url")}.${signature}`;
  return { token, expiresAt };
}

export function verifyQuoteToken(token: string): QuotePayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedData, signature] = parts;
  if (!encodedData || !signature) return null;
  const data = Buffer.from(encodedData, "base64url").toString("utf8");

  const hmac = createHmac(
    "sha256",
    Buffer.from(process.env.QUOTE_HMAC_KEY || "", "hex"),
  );
  hmac.update(data, "utf8");
  const expectedSignature = hmac.digest("base64url");

  if (signature !== expectedSignature) return null;

  const [productSlug, payment, totalIdr, expiresAtStr] = data.split(":");
  if (!productSlug || !payment || !totalIdr || !expiresAtStr) return null;

  const expiresAt = parseInt(expiresAtStr, 10);
  if (Date.now() > expiresAt) return null;

  return { productSlug, payment, totalIdr, expiresAt };
}
