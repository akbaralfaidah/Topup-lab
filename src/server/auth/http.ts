import type { NextRequest } from "next/server";
import { getEnvironment } from "@/server/config/env";
import { sessionCookieName, sessionLifetimeSeconds } from "./session";

export function validMutationOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const expected = new URL(getEnvironment().APP_URL).origin;
  if (origin === expected) return true;
  if (process.env.NODE_ENV === "production") return false;
  const host = request.headers.get("host");
  return (
    !!host &&
    /^(localhost|127\.0\.0\.1):[0-9]{1,5}$/.test(host) &&
    origin === `${request.nextUrl.protocol}//${host}`
  );
}

export async function boundedJson(request: NextRequest): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    throw new Error("content-type");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) throw new Error("size");
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } finally {
    reader.releaseLock();
  }
}

export function sessionCookie(token: string) {
  return {
    name: sessionCookieName,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionLifetimeSeconds,
  };
}
