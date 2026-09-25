import { NextResponse, type NextRequest } from "next/server";
import { revokeSession } from "@/server/auth/service";
import { validMutationOrigin } from "@/server/auth/http";
import { sessionCookieName } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (!validMutationOrigin(request))
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers });
  try {
    await revokeSession(request.cookies.get(sessionCookieName)?.value);
  } catch {
    return NextResponse.json(
      { error: "unavailable" },
      { status: 503, headers },
    );
  }
  const response = NextResponse.json({ state: "signed_out" }, { headers });
  response.cookies.set({
    name: sessionCookieName,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
