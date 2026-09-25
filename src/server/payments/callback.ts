import { eq, and, sql } from "drizzle-orm";
import { getDatabase } from "@/server/db";
import * as s from "@/server/db/schema";
import { getGateway } from "./registry";
import type { PaymentGatewayCallbackResult } from "./gateway";

export type CallbackProcessResult =
  | { ok: true; state: "processed" | "ignored" | "duplicate" }
  | { ok: false; error: string; code?: string };

export async function processPaymentCallback(
  gatewayCode: string,
  rawBody: string,
  headers: Record<string, string>
): Promise<CallbackProcessResult> {
  let gateway;
  try {
    gateway = getGateway(gatewayCode);
  } catch {
    return { ok: false, error: "Unknown gateway", code: "UNKNOWN_GATEWAY" };
  }

  let verifiedEvent;
  try {
    verifiedEvent = await gateway.verifyCallback(rawBody, headers);
  } catch {
    return { ok: false, error: "Signature verification failed", code: "INVALID_SIGNATURE" };
  }

  const db = getDatabase().db;

  // 1. Fetch payment by gatewayReference
  const paymentsRows = await db
    .select()
    .from(s.payments)
    .where(
      and(
        eq(s.payments.gatewayCode, gatewayCode),
        eq(s.payments.gatewayReference, verifiedEvent.gatewayReference)
      )
    )
    .limit(1);

  if (paymentsRows.length === 0) {
    return { ok: false, error: "Payment not found", code: "PAYMENT_NOT_FOUND" };
  }
  const payment = paymentsRows[0]!;

  // 2. Amount and Currency mismatch check
  if (
    (verifiedEvent.amountIdr !== undefined && verifiedEvent.amountIdr !== payment.amountIdr) ||
    (verifiedEvent.currency !== undefined && verifiedEvent.currency !== payment.currency)
  ) {
    // We should safely store the event but not transition to PAID.
    // For now, we will mark this as amount mismatch.
    // We still insert the event but we stop processing.
    await insertEventSafe(db, payment.id, payment.orderId, gatewayCode, verifiedEvent);
    return { ok: false, error: "Amount or currency mismatch", code: "AMOUNT_MISMATCH" };
  }

  // 3. Deduplicate event
  const insertedEventId = await insertEventSafe(db, payment.id, payment.orderId, gatewayCode, verifiedEvent);
  if (!insertedEventId) {
    // Duplicate event
    return { ok: true, state: "duplicate" };
  }

  // 4. State transition
  if (verifiedEvent.normalizedStatus === "PAID") {
    // If it's already PAID or beyond, skip
    if (payment.status === "PAID" || payment.status === "REFUNDED") {
      return { ok: true, state: "ignored" };
    }

    try {
      await db.transaction(async (tx) => {
        // Mark payment as PAID
        await tx
          .update(s.payments)
          .set({ status: "PAID", paidAt: new Date() })
          .where(eq(s.payments.id, payment.id));

        // Transition order
        const orderRows = await tx
          .select({ status: s.orders.status })
          .from(s.orders)
          .where(eq(s.orders.id, payment.orderId))
          .for("update");
        
        if (orderRows.length === 0) throw new Error("Order not found");
        const order = orderRows[0]!;

        if (order.status === "WAITING_PAYMENT" || order.status === "PAYMENT_PENDING") {
          const updateResult = await tx
            .update(s.orders)
            .set({ status: "PAID", statusChangedAt: new Date() })
            .where(
              sql`${s.orders.id} = ${payment.orderId} AND ${s.orders.status} = ${order.status}`
            )
            .returning({ id: s.orders.id });

          if (updateResult.length === 0) throw new Error("Order transition stale");

          await tx.insert(s.orderStatusHistory).values({
            id: crypto.randomUUID(),
            orderId: payment.orderId,
            fromStatus: order.status,
            toStatus: "PAID",
            source: "PAYMENT",
            reasonCode: "GATEWAY_CALLBACK_PAID",
            actorId: null,
            correlationId: insertedEventId,
            idempotencyKey: verifiedEvent.eventKey,
            occurredAt: new Date(),
          });
        } else if (order.status === "EXPIRED" || order.status === "CANCELLED" || order.status === "FAILED") {
          const updateResult = await tx
            .update(s.orders)
            .set({ status: "MANUAL_REVIEW", statusChangedAt: new Date() })
            .where(
              sql`${s.orders.id} = ${payment.orderId} AND ${s.orders.status} = ${order.status}`
            )
            .returning({ id: s.orders.id });

          if (updateResult.length === 0) throw new Error("Order transition stale");

          await tx.insert(s.orderStatusHistory).values({
            id: crypto.randomUUID(),
            orderId: payment.orderId,
            fromStatus: order.status,
            toStatus: "MANUAL_REVIEW",
            source: "PAYMENT",
            reasonCode: "GATEWAY_CALLBACK_LATE_PAID",
            actorId: null,
            correlationId: insertedEventId,
            idempotencyKey: verifiedEvent.eventKey,
            occurredAt: new Date(),
          });
        }
        
        // Mark event processed
        await tx.insert(s.paymentEventProcessing).values({
            eventId: insertedEventId,
            state: "PROCESSED",
            processedAt: new Date(),
        });
      });
      return { ok: true, state: "processed" };
    } catch {
        // Record processing failure
        await db.insert(s.paymentEventProcessing).values({
            eventId: insertedEventId,
            state: "FAILED",
            attemptCount: 1,
            errorCode: "TRANSACTION_FAILED"
        }).onConflictDoUpdate({
            target: s.paymentEventProcessing.eventId,
            set: { 
                state: "FAILED",
                attemptCount: sql`${s.paymentEventProcessing.attemptCount} + 1`
            }
        });
        return { ok: false, error: "Database transaction failed", code: "TX_FAILED" };
    }
  } else if (verifiedEvent.normalizedStatus === "EXPIRED" || verifiedEvent.normalizedStatus === "FAILED" || verifiedEvent.normalizedStatus === "CANCELLED") {
      // Just update the payment status to the target status if it is currently PENDING/CREATED
      if (payment.status === "PENDING" || payment.status === "CREATED") {
          await db.update(s.payments)
            .set({ status: verifiedEvent.normalizedStatus })
            .where(eq(s.payments.id, payment.id));
      }
      return { ok: true, state: "processed" };
  }

  return { ok: true, state: "ignored" };
}

async function insertEventSafe(db: ReturnType<typeof getDatabase>["db"], paymentId: string, orderId: string, gatewayCode: string, verifiedEvent: PaymentGatewayCallbackResult): Promise<string | null> {
    const eventId = crypto.randomUUID();
    try {
        await db.insert(s.paymentEvents).values({
            id: eventId,
            paymentId,
            orderId,
            gatewayCode,
            eventKey: verifiedEvent.eventKey,
            eventType: verifiedEvent.eventType,
            normalizedStatus: verifiedEvent.normalizedStatus,
            safePayload: verifiedEvent.safePayload,
            correlationId: crypto.randomUUID(),
        });
        return eventId;
    } catch (error: any) {
        if (error?.code === "23505" || error?.cause?.code === "23505") return null; // Duplicate event
        throw error;
    }
}
