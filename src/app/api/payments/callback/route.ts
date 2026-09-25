import { NextResponse, type NextRequest } from "next/server";
import { processPaymentCallback } from "@/server/payments/callback";

export async function POST(request: NextRequest) {
  // We extract the gateway code from a query param, header, or URL path.
  // Assuming URL: /api/payments/callback?gateway=DEMO
  const gatewayCode = request.nextUrl.searchParams.get("gateway");

  if (!gatewayCode) {
    return NextResponse.json({ error: "Missing gateway code" }, { status: 400 });
  }

  // Get raw body and headers
  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  for (const [key, value] of request.headers.entries()) {
    headers[key] = value;
  }

  const result = await processPaymentCallback(gatewayCode, rawBody, headers);

  if (!result.ok) {
    console.error("Callback processing failed:", result.error, result.code);
    // Real webhook providers generally require a 200 or 400 response.
    // If we return 500 they might retry endlessly.
    // 400 for signature fail, 200 for safe ignores.
    if (result.code === "INVALID_SIGNATURE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, state: result.state }, { status: 200 });
}
