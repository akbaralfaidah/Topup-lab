import { eq } from "drizzle-orm";
import { getDatabase } from "@/server/db";
import * as s from "@/server/db/schema";
import { getGateway } from "./registry";
import type { PaymentMethodCategory } from "./gateway";

export type CreatePaymentRequest = {
  orderId: string;
  gatewayCode: string;
  methodCode: string;
  category: "QRIS" | "VIRTUAL_ACCOUNT" | "EWALLET" | "RETAIL" | "WALLET";
  idempotencyKey: string;
  customerId?: string | null;
  expiresInSeconds?: number;
};

export type CreatePaymentResponse =
  | { state: "created"; paymentId: string; gatewayReference: string; instruction: Record<string, unknown>; expiresAt: Date }
  | { state: "order_not_found" }
  | { state: "invalid_state" }
  | { state: "payment_conflict" }
  | { state: "gateway_error"; message: string };

export async function createPaymentForOrder(req: CreatePaymentRequest): Promise<CreatePaymentResponse> {
  const db = getDatabase().db;

  // 1. Verify idempotency
  const existingPayments = await db
    .select()
    .from(s.payments)
    .where(eq(s.payments.idempotencyKey, req.idempotencyKey))
    .limit(1);

  if (existingPayments.length > 0) {
    const existing = existingPayments[0]!;
    // Logical equivalence
    if (
      existing.orderId !== req.orderId ||
      existing.gatewayCode !== req.gatewayCode ||
      existing.methodCode !== req.methodCode
    ) {
      return { state: "payment_conflict" };
    }
    // Only return if it's not a final state and hasn't expired.
    // If it's EXPIRED, they should issue a new payment attempt with a new idempotency key.
    // But for idempotency strictly, returning the exact state of the previous call is required.
    // Let's just return it if it has a reference. The caller UI can decide what to do if it's expired.
    if (!existing.gatewayReference) {
      return { state: "payment_conflict" };
    }
    
    // We don't store instruction in DB directly, but demo generates it deterministically.
    // Real gateways might need an inspect() call to get instruction. We'll reconstruct it for demo.
    const gateway = getGateway(req.gatewayCode);
    if (gateway.code === "DEMO") {
        // Just mock it since DEMO does it deterministically
        const instrResponse = await gateway.createPayment({
            orderId: req.orderId,
            amountIdr: existing.amountIdr,
            methodCode: req.methodCode,
            category: req.category as PaymentMethodCategory,
            idempotencyKey: req.idempotencyKey,
        });
        return {
            state: "created",
            paymentId: existing.id,
            gatewayReference: existing.gatewayReference,
            instruction: instrResponse.customerInstruction,
            expiresAt: existing.expiresAt ?? new Date(),
        };
    }
    
    // If real gateway, you'd fetch the status. For now, we only have DEMO.
    return { state: "payment_conflict" };
  }

  // 2. Fetch order and verify state
  const orders = await db
    .select({
      id: s.orders.id,
      status: s.orders.status,
      customerId: s.orders.customerId,
      totalIdr: s.orders.totalIdr,
    })
    .from(s.orders)
    .where(eq(s.orders.id, req.orderId))
    .limit(1);

  if (orders.length === 0) return { state: "order_not_found" };
  const order = orders[0]!;

  if (req.customerId && order.customerId && order.customerId !== req.customerId) {
    return { state: "order_not_found" }; // IDOR protection
  }

  if (order.status !== "WAITING_PAYMENT" && order.status !== "PAYMENT_PENDING") {
    return { state: "invalid_state" };
  }

  // 3. Resolve gateway
  const gateway = getGateway(req.gatewayCode);

  // 4. External Recovery & Creation
  let gatewayResponse;
  try {
    // 4a. Attempt to recover externally (in case local DB failed after external creation)
    gatewayResponse = await gateway.getPaymentByIdempotencyKey(req.idempotencyKey);
    
    // 4b. Create anew if not recovered
    if (!gatewayResponse) {
      gatewayResponse = await gateway.createPayment({
        orderId: order.id,
        amountIdr: order.totalIdr,
        methodCode: req.methodCode,
        category: req.category as PaymentMethodCategory,
        idempotencyKey: req.idempotencyKey,
        expiresInSeconds: req.expiresInSeconds,
      });
    }
  } catch (error: unknown) {
    return { state: "gateway_error", message: error instanceof Error ? error.message : "Unknown error" };
  }

  // 5. Persist payment and update order
  try {
    const paymentId = crypto.randomUUID();
    
    await db.transaction(async (tx) => {
      // Transition order if needed (WAITING_PAYMENT -> PAYMENT_PENDING is optional, we will stay WAITING_PAYMENT)
      // We do not transition the order to PAYMENT_PENDING here per the requirement: 
      // "order may remain WAITING_PAYMENT"
      // Wait, let's keep it WAITING_PAYMENT for now.

      await tx.insert(s.payments).values({
        id: paymentId,
        orderId: order.id,
        gatewayCode: gateway.code,
        gatewayReference: gatewayResponse.gatewayReference,
        idempotencyKey: req.idempotencyKey,
        methodCode: req.methodCode,
        category: req.category,
        currency: "IDR",
        amountIdr: order.totalIdr,
        status: "PENDING",
        expiresAt: gatewayResponse.expiresAt,
      });
    });

    return {
      state: "created",
      paymentId,
      gatewayReference: gatewayResponse.gatewayReference,
      instruction: gatewayResponse.customerInstruction,
      expiresAt: gatewayResponse.expiresAt,
    };
  } catch (error: any) {
    if (error?.code === "23505" || error?.cause?.code === "23505") {
      return { state: "payment_conflict" };
    }
    throw error;
  }
}
