import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  authenticate,
  issueSession,
  AuthError,
  revokeSession,
} from "@/server/auth/service";
import {
  boundedJson,
  sessionCookie,
  validMutationOrigin,
} from "@/server/auth/http";
import { loginSchema, safeReturnPath } from "@/server/auth/input";
import { sessionCookieName } from "@/server/auth/session";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
const bodySchema = loginSchema.extend({
  returnTo: z.string().max(512).optional(),
});

export async function POST(request: NextRequest) {
  if (!validMutationOrigin(request))
    return NextResponse.json(
      { error: "forbidden" },
      { status: 403, headers: noStore },
    );
  try {
    const parsed = bodySchema.safeParse(await boundedJson(request));
    if (!parsed.success)
      return NextResponse.json(
        { error: "invalid" },
        { status: 400, headers: noStore },
      );
    const userId = await authenticate({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    const { token } = await issueSession(userId);
    const response = NextResponse.json(
      { state: "ready", returnTo: safeReturnPath(parsed.data.returnTo) },
      { headers: noStore },
    );
    response.cookies.set(sessionCookie(token));
    await revokeSession(request.cookies.get(sessionCookieName)?.value);
    return response;
  } catch (error) {
    const code =
      error instanceof AuthError && error.code === "unavailable"
        ? "unavailable"
        : "invalid";
    return NextResponse.json(
      { error: code },
      { status: code === "unavailable" ? 503 : 401, headers: noStore },
    );
  }
}
