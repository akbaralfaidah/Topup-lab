import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDatabase } from "@/server/db";
import * as s from "@/server/db/schema";
import { currentSession } from "@/server/auth/session";
import { cookies } from "next/headers";
import { GUEST_COOKIE_NAME, verifyGuestToken } from "@/server/checkout/guest-token";
import { createPaymentForOrder } from "@/server/payments/create-payment";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicReference: string }> }
) {
  const { publicReference } = await params;
  const db = getDatabase().db;

  const orderRows = await db
    .select({
      id: s.orders.id,
      customerId: s.orders.customerId,
      status: s.orders.status,
    })
    .from(s.orders)
    .where(eq(s.orders.publicReference, publicReference))
    .limit(1);

  if (orderRows.length === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = orderRows[0]!;

  const session = await currentSession();
  if (order.customerId) {
    if (session?.userId !== order.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } else {
    const guestCookie = (await cookies()).get(GUEST_COOKIE_NAME)?.value;
    if (!guestCookie || !verifyGuestToken(guestCookie, publicReference)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  // Idempotency: you would typically parse an idempotency key from the body.
  // For simplicity, we can use the orderId itself if we only allow 1 attempt at a time,
  // or a UUID sent by the client.
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  
  const idempotencyKey = String(body.idempotencyKey || `pay_${order.id}`);
  const gatewayCode = String(body.gatewayCode || "DEMO");
  const methodCode = String(body.methodCode || "QRIS");
  const category = (body.category as "QRIS" | "VIRTUAL_ACCOUNT" | "EWALLET" | "RETAIL" | "WALLET") || "QRIS";
  
  const result = await createPaymentForOrder({
    orderId: order.id,
    gatewayCode,
    methodCode,
    category,
    idempotencyKey,
    customerId: order.customerId,
  });

  if (result.state === "created") {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: result.state }, { status: 400 });
}
