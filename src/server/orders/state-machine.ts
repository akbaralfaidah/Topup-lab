import { sql } from "drizzle-orm";
import { getDatabase } from "@/server/db";
import * as s from "@/server/db/schema";
import type { OrderStatus, ActorOrigin } from "@/server/db/schema/enums";

export const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["WAITING_PAYMENT", "CANCELLED"],
  WAITING_PAYMENT: ["PAYMENT_PENDING", "PAID", "EXPIRED", "CANCELLED"],
  PAYMENT_PENDING: ["PAID", "EXPIRED", "MANUAL_REVIEW"],
  PAID: ["QUEUED", "REFUND_PENDING", "MANUAL_REVIEW"],
  QUEUED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PROVIDER_PENDING", "SUCCESS", "FAILED", "MANUAL_REVIEW"],
  PROVIDER_PENDING: ["SUCCESS", "FAILED", "MANUAL_REVIEW"],
  FAILED: ["REFUND_PENDING", "REFUNDED", "MANUAL_REVIEW"],
  REFUND_PENDING: ["REFUNDED", "MANUAL_REVIEW"],
  SUCCESS: ["MANUAL_REVIEW"],
  EXPIRED: ["MANUAL_REVIEW"],
  CANCELLED: ["MANUAL_REVIEW"],
  REFUNDED: ["MANUAL_REVIEW"],
  MANUAL_REVIEW: [
    "QUEUED",
    "PROCESSING",
    "SUCCESS",
    "FAILED",
    "REFUND_PENDING",
    "REFUNDED",
    "CANCELLED",
  ],
};

export type TransitionRequest = {
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  source: ActorOrigin;
  reasonCode: string;
  actorId?: string | null;
  correlationId?: string;
  idempotencyKey?: string;
};

export async function transitionOrder(
  req: TransitionRequest,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (req.fromStatus === req.toStatus) {
    return { ok: false, error: "no_change" };
  }

  const allowed = validTransitions[req.fromStatus];
  if (!allowed || !allowed.includes(req.toStatus)) {
    return { ok: false, error: "invalid_transition" };
  }

  const db = getDatabase().db;

  try {
    const success = await db.transaction(async (tx) => {
      // 1. Update order if and only if it is in fromStatus
      const updateResult = await tx
        .update(s.orders)
        .set({
          status: req.toStatus,
          statusChangedAt: new Date(),
        })
        .where(
          sql`${s.orders.id} = ${req.orderId} AND ${s.orders.status} = ${req.fromStatus}`,
        )
        .returning({ id: s.orders.id });

      if (updateResult.length === 0) {
        return false;
      }

      // 2. Insert history row
      await tx.insert(s.orderStatusHistory).values({
        id: crypto.randomUUID(),
        orderId: req.orderId,
        fromStatus: req.fromStatus,
        toStatus: req.toStatus,
        source: req.source,
        reasonCode: req.reasonCode,
        actorId: req.actorId ?? null,
        correlationId: req.correlationId ?? crypto.randomUUID(),
        idempotencyKey: req.idempotencyKey ?? crypto.randomUUID(),
        occurredAt: new Date(),
      });

      return true;
    });

    if (!success) {
      return { ok: false, error: "stale_state" };
    }

    return { ok: true };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      // Unique violation on idempotency key
      return { ok: false, error: "duplicate_idempotency" };
    }
    throw error;
  }
}
