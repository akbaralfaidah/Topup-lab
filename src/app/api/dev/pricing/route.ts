import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { localDemoPricingEnabled } from "@/server/pricing/demo-gate";
import {
  previewRuleChange,
  readSimulation,
  RuleAdminError,
  saveRule,
} from "@/server/pricing/administration";

export const dynamic = "force-dynamic";

const requestSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("simulate"),
    productId: z.uuid(),
    tierId: z.uuid(),
    referenceTime: z.string().datetime({ offset: true }).optional(),
  }),
  z.strictObject({
    action: z.literal("preview"),
    rule: z.unknown(),
    productId: z.uuid().optional(),
  }),
  z.strictObject({ action: z.literal("save"), rule: z.unknown() }),
]);
const headers = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  const host = request.headers.get("host");
  if (
    !localDemoPricingEnabled() ||
    !host ||
    !/^(localhost|127\.0\.0\.1):[0-9]{1,5}$/.test(host)
  )
    return new Response(null, { status: 404, headers });
  if (request.headers.get("origin") !== `${request.nextUrl.protocol}//${host}`)
    return NextResponse.json({ state: "forbidden" }, { status: 403, headers });
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    return NextResponse.json({ state: "invalid" }, { status: 415, headers });
  const bodyText = await request.text();
  if (bodyText.length > 4096)
    return NextResponse.json({ state: "invalid" }, { status: 413, headers });
  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ state: "invalid" }, { status: 400, headers });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ state: "invalid" }, { status: 400, headers });
  try {
    if (parsed.data.action === "simulate")
      return NextResponse.json(
        {
          state: "ready",
          ...(await readSimulation(
            parsed.data.productId,
            parsed.data.tierId,
            parsed.data.referenceTime,
          )),
        },
        { headers },
      );
    if (parsed.data.action === "preview")
      return NextResponse.json(
        {
          state: "ready",
          preview: await previewRuleChange(
            parsed.data.rule,
            parsed.data.productId,
          ),
        },
        { headers },
      );
    return NextResponse.json(
      { state: "saved", ...(await saveRule(parsed.data.rule)) },
      { headers },
    );
  } catch (error) {
    const code = error instanceof RuleAdminError ? error.code : "unavailable";
    const status =
      code === "invalid"
        ? 422
        : code === "conflict" || code === "stale"
          ? 409
          : 503;
    return NextResponse.json({ state: code }, { status, headers });
  }
}
