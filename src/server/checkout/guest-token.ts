import { createHmac } from "node:crypto";
import { cookies } from "next/headers";

export function signGuestToken(publicReference: string): string {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const data = `${publicReference}:${expiresAt}`;
  const hmac = createHmac(
    "sha256",
    Buffer.from(process.env.GUEST_HMAC_KEY || "", "hex"),
  );
  hmac.update(data, "utf8");
  const signature = hmac.digest("base64url");

  return `${Buffer.from(data, "utf8").toString("base64url")}.${signature}`;
}

export function verifyGuestToken(
  token: string,
  publicReference: string,
): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [encodedData, signature] = parts;
  if (!encodedData || !signature) return false;
  const data = Buffer.from(encodedData, "base64url").toString("utf8");

  const hmac = createHmac(
    "sha256",
    Buffer.from(process.env.GUEST_HMAC_KEY || "", "hex"),
  );
  hmac.update(data, "utf8");
  const expectedSignature = hmac.digest("base64url");

  if (signature !== expectedSignature) return false;

  const [ref, expiresAtStr] = data.split(":");
  if (ref !== publicReference || !expiresAtStr) return false;

  const expiresAt = parseInt(expiresAtStr, 10);
  if (Date.now() > expiresAt) return false;

  return true;
}

export const GUEST_COOKIE_NAME = "topuplab_guest";

export async function setGuestCookie(token: string, publicReference: string) {
  const c = await cookies();
  c.set({
    name: GUEST_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/orders/${publicReference}`,
    maxAge: 60 * 60 * 24 * 7,
  });
}
