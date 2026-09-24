import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readDemoPreviews } from "@/server/pricing/preview";
import { validateTarget } from "@/lib/target-input";

export const dynamic = "force-dynamic";

const requestSchema = z.strictObject({
  productSlug: z.string().regex(/^[a-z0-9-]{1,80}$/),
  payment: z.enum(["QRIS", "VA", "EWALLET"]),
  target: z.record(z.string(), z.string().max(256)).optional(),
});
const headers = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    return NextResponse.json(
      { state: "invalid_request" },
      { status: 415, headers },
    );
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    return NextResponse.json(
      { state: "invalid_request" },
      { status: 403, headers },
    );
  const bodyText = await request.text();
  if (bodyText.length > 2048)
    return NextResponse.json(
      { state: "invalid_request" },
      { status: 413, headers },
    );
  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json(
      { state: "invalid_request" },
      { status: 400, headers },
    );
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { state: "invalid_request" },
      { status: 400, headers },
    );
  const result = await readDemoPreviews(
    [parsed.data.productSlug],
    parsed.data.payment,
  );
  if (result.state !== "ready")
    return NextResponse.json(
      { state: result.state },
      { status: result.state === "invalid" ? 404 : 503, headers },
    );
  const item = result.products[0];
  if (!item)
    return NextResponse.json(
      { state: "unavailable" },
      { status: 503, headers },
    );
  if (!item.quote.available)
    return NextResponse.json(
      { state: "product_unavailable" },
      { status: 409, headers },
    );
  if (parsed.data.target) {
    const validation = validateTarget(item.inputDefinition, parsed.data.target);
    if (!validation.ok)
      return NextResponse.json(
        { state: "invalid_target", errors: validation.errors },
        { status: 422, headers },
      );
    return NextResponse.json(
      { state: "ready", quote: item.quote, maskedTarget: validation.masked },
      { headers },
    );
  }
  return NextResponse.json({ state: "ready", quote: item.quote }, { headers });
}
