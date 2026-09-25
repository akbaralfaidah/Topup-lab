import { NextResponse, type NextRequest } from "next/server";
import { requirePermission, requireSession } from "@/server/auth/authorization";
import { boundedJson, validMutationOrigin } from "@/server/auth/http";
import {
  previewRuleChange,
  readSimulation,
  RuleAdminError,
  saveRule,
} from "@/server/pricing/administration";
import { pricingRequestSchema } from "@/server/pricing/http";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json(
      { state: "unauthorized" },
      { status: 401, headers },
    );
  if (!validMutationOrigin(request))
    return NextResponse.json({ state: "forbidden" }, { status: 403, headers });
  let body: unknown;
  try {
    body = await boundedJson(request);
  } catch {
    return NextResponse.json({ state: "invalid" }, { status: 400, headers });
  }
  const parsed = pricingRequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ state: "invalid" }, { status: 400, headers });
  const access = await requirePermission("admin.access");
  const actionPermission = await requirePermission(
    parsed.data.action === "save" ? "pricing.write" : "pricing.read",
  );
  if (!access || !actionPermission)
    return NextResponse.json({ state: "forbidden" }, { status: 403, headers });
  const context = { mode: "admin" as const, actorId: session.userId };
  try {
    if (parsed.data.action === "simulate")
      return NextResponse.json(
        {
          state: "ready",
          ...(await readSimulation(
            parsed.data.productId,
            parsed.data.tierId,
            parsed.data.referenceTime,
            context,
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
            context,
          ),
        },
        { headers },
      );
    return NextResponse.json(
      { state: "saved", ...(await saveRule(parsed.data.rule, context)) },
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
