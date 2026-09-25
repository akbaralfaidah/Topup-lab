import { NextResponse, type NextRequest } from "next/server";
import { boundedJson, validMutationOrigin } from "@/server/auth/http";
import { createOrder, type CheckoutRequest } from "@/server/orders/checkout";
import { signGuestToken, setGuestCookie } from "@/server/checkout/guest-token";
import { currentSession } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  if (!validMutationOrigin(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await boundedJson(request);
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (
    typeof body.productSlug !== "string" ||
    typeof body.paymentMethod !== "string" ||
    typeof body.target !== "object" ||
    body.target === null ||
    typeof body.quoteToken !== "string" ||
    typeof body.idempotencyKey !== "string" ||
    body.idempotencyKey.length < 16 ||
    body.idempotencyKey.length > 256
  ) {
    return NextResponse.json({ error: "invalid_schema" }, { status: 400 });
  }

  const req: CheckoutRequest = {
    productSlug: body.productSlug,
    paymentMethod: body.paymentMethod,
    target: body.target,
    quoteToken: body.quoteToken,
    idempotencyKey: body.idempotencyKey,
  };

  const response = await createOrder(req);

  if (response.state === "created") {
    const session = await currentSession();
    if (!session) {
      // It's a guest order, issue capability cookie
      const token = signGuestToken(response.publicReference);
      await setGuestCookie(token, response.publicReference);
    }
    return NextResponse.json(response, { status: 201 });
  }

  if (response.state === "unauthorized")
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  if (response.state === "invalid_request")
    return NextResponse.json(
      { error: "invalid_request", errors: response.errors },
      { status: 400 },
    );
  if (response.state === "product_unavailable")
    return NextResponse.json({ error: "product_unavailable" }, { status: 409 });
  if (response.state === "quote_expired")
    return NextResponse.json({ error: "quote_expired" }, { status: 409 });
  if (response.state === "price_changed")
    return NextResponse.json(
      { error: "price_changed", newTotalIdr: response.newTotalIdr },
      { status: 409 },
    );
  if (response.state === "order_conflict")
    return NextResponse.json({ error: "order_conflict" }, { status: 409 });

  return NextResponse.json({ error: "unavailable" }, { status: 503 });
}
