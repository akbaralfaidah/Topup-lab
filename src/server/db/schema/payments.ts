import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  index,
  unique,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";
import {
  paymentStatus,
  paymentCategory,
  processingState,
  currency,
} from "./enums";
import {
  id,
  instant,
  timestamps,
  money,
  restrict,
  nonnegative,
  objectJson,
} from "./shared";
import { orders } from "./orders";
import type { SafeEvent } from "./validation";

export const payments = pgTable(
  "payments",
  {
    id: id(),
    orderId: uuid("order_id").notNull(),
    gatewayCode: text("gateway_code").notNull(),
    gatewayReference: text("gateway_reference"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    methodCode: text("method_code").notNull(),
    category: paymentCategory("category").notNull(),
    currency: currency("currency").default("IDR").notNull(),
    amountIdr: money("amount_idr").notNull(),
    status: paymentStatus("status").default("CREATED").notNull(),
    expiresAt: instant("expires_at"),
    paidAt: instant("paid_at"),
    ...timestamps(),
  },
  (t) => [
    foreignKey({
      name: "payment_order_terms_fk",
      columns: [t.orderId, t.currency, t.amountIdr],
      foreignColumns: [orders.id, orders.currency, orders.totalIdr],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    unique("payment_gateway_reference_unique").on(
      t.gatewayCode,
      t.gatewayReference,
    ),
    unique("payment_event_identity_unique").on(t.id, t.orderId, t.gatewayCode),
    index("payments_order_idx").on(t.orderId),
    index("payments_status_expiry_idx").on(t.status, t.expiresAt),
    nonnegative("payment_amount_nonnegative", t.amountIdr),
  ],
);
export const paymentEvents = pgTable(
  "payment_events",
  {
    id: id(),
    paymentId: uuid("payment_id").notNull(),
    orderId: uuid("order_id").notNull(),
    gatewayCode: text("gateway_code").notNull(),
    eventKey: text("event_key").notNull(),
    eventType: text("event_type").notNull(),
    normalizedStatus: paymentStatus("normalized_status").notNull(),
    safePayload: jsonb("safe_payload").$type<SafeEvent>().default({}).notNull(),
    correlationId: uuid("correlation_id").notNull(),
    receivedAt: instant("received_at").defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      name: "payment_event_payment_order_gateway_fk",
      columns: [t.paymentId, t.orderId, t.gatewayCode],
      foreignColumns: [payments.id, payments.orderId, payments.gatewayCode],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    unique("payment_event_dedup_unique").on(t.gatewayCode, t.eventKey),
    index("payment_events_payment_received_idx").on(t.paymentId, t.receivedAt),
    index("payment_events_order_idx").on(t.orderId),
    objectJson("payment_safe_payload_object", t.safePayload),
  ],
);
export const paymentEventProcessing = pgTable(
  "payment_event_processing",
  {
    eventId: uuid("event_id")
      .primaryKey()
      .references(() => paymentEvents.id, restrict),
    state: processingState("state").default("RECEIVED").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    processedAt: instant("processed_at"),
    errorCode: text("error_code"),
    ...timestamps(),
  },
  (t) => [
    index("payment_processing_state_idx").on(t.state, t.createdAt),
    nonnegative("payment_processing_attempts_nonnegative", t.attemptCount),
    check(
      "payment_processing_completed_timestamp",
      sql`${t.state} NOT IN ('PROCESSED', 'IGNORED') OR ${t.processedAt} IS NOT NULL`,
    ),
  ],
);
