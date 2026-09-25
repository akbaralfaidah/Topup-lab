import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  AuthError,
  issueSession,
  registerCustomer,
} from "@/server/auth/service";
import {
  boundedJson,
  sessionCookie,
  validMutationOrigin,
} from "@/server/auth/http";
import { registrationSchema, safeReturnPath } from "@/server/auth/input";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
const bodySchema = registrationSchema.extend({
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
    const userId = await registerCustomer({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    const { token } = await issueSession(userId);
    const response = NextResponse.json(
      { state: "ready", returnTo: safeReturnPath(parsed.data.returnTo) },
      { status: 201, headers: noStore },
    );
    response.cookies.set(sessionCookie(token));
    return response;
  } catch (error) {
    const code = error instanceof AuthError ? error.code : "invalid";
    return NextResponse.json(
      { error: code },
      {
        status: code === "duplicate" ? 409 : code === "unavailable" ? 503 : 400,
        headers: noStore,
      },
    );
  }
}
