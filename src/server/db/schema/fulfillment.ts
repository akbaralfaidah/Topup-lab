import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  index,
  unique,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { providerAttemptStatus, processingState } from "./enums";
import {
  id,
  instant,
  timestamps,
  money,
  nonnegative,
  restrict,
  objectJson,
} from "./shared";
import { orderItems } from "./orders";
import { providers, providerSkus } from "./providers";
import type { SafeEvent } from "./validation";

export const providerAttempts = pgTable(
  "provider_attempts",
  {
    id: id(),
    orderId: uuid("order_id").notNull(),
    orderItemId: uuid("order_item_id").notNull(),
    productId: uuid("product_id").notNull(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, restrict),
    providerSkuId: uuid("provider_sku_id").notNull(),
    attemptReference: uuid("attempt_reference")
      .defaultRandom()
      .notNull()
      .unique(),
    providerTransactionReference: text("provider_transaction_reference"),
    status: providerAttemptStatus("status").default("CREATED").notNull(),
    costIdr: money("cost_idr").notNull(),
    submittedAt: instant("submitted_at"),
    lastCheckedAt: instant("last_checked_at"),
    terminalAt: instant("terminal_at"),
    ...timestamps(),
  },
  (t) => [
    foreignKey({
      name: "attempt_item_order_product_fk",
      columns: [t.orderItemId, t.orderId, t.productId],
      foreignColumns: [orderItems.id, orderItems.orderId, orderItems.productId],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    foreignKey({
      name: "attempt_sku_provider_product_fk",
      columns: [t.providerSkuId, t.providerId, t.productId],
      foreignColumns: [
        providerSkus.id,
        providerSkus.providerId,
        providerSkus.productId,
      ],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    unique("attempt_provider_transaction_unique").on(
      t.providerId,
      t.providerTransactionReference,
    ),
    unique("attempt_event_identity_unique").on(t.id, t.providerId),
    uniqueIndex("attempt_one_unresolved_or_success_per_item")
      .on(t.orderItemId)
      .where(
        sql`${t.status} IN ('CREATED', 'SUBMITTED', 'PENDING', 'SUCCESS')`,
      ),
    index("attempts_order_idx").on(t.orderId),
    index("attempts_sku_idx").on(t.providerSkuId),
    index("attempts_pending_check_idx").on(t.status, t.lastCheckedAt),
    nonnegative("attempt_cost_nonnegative", t.costIdr),
    check(
      "attempt_terminal_timestamp",
      sql`(${t.status} IN ('SUCCESS', 'FAILED', 'CANCELLED') AND ${t.terminalAt} IS NOT NULL) OR (${t.status} IN ('CREATED', 'SUBMITTED', 'PENDING') AND ${t.terminalAt} IS NULL)`,
    ),
  ],
);
export const providerEvents = pgTable(
  "provider_events",
  {
    id: id(),
    attemptId: uuid("attempt_id").notNull(),
    providerId: uuid("provider_id").notNull(),
    eventKey: text("event_key").notNull(),
    eventType: text("event_type").notNull(),
    normalizedStatus: providerAttemptStatus("normalized_status").notNull(),
    safePayload: jsonb("safe_payload").$type<SafeEvent>().default({}).notNull(),
    correlationId: uuid("correlation_id").notNull(),
    receivedAt: instant("received_at").defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      name: "provider_event_attempt_provider_fk",
      columns: [t.attemptId, t.providerId],
      foreignColumns: [providerAttempts.id, providerAttempts.providerId],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    unique("provider_event_dedup_unique").on(t.providerId, t.eventKey),
    index("provider_events_attempt_received_idx").on(t.attemptId, t.receivedAt),
    objectJson("provider_safe_payload_object", t.safePayload),
  ],
);
export const providerEventProcessing = pgTable(
  "provider_event_processing",
  {
    eventId: uuid("event_id")
      .primaryKey()
      .references(() => providerEvents.id, restrict),
    state: processingState("state").default("RECEIVED").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    processedAt: instant("processed_at"),
    errorCode: text("error_code"),
    ...timestamps(),
  },
  (t) => [
    index("provider_processing_state_idx").on(t.state, t.createdAt),
    nonnegative("provider_processing_attempts_nonnegative", t.attemptCount),
    check(
      "provider_processing_completed_timestamp",
      sql`${t.state} NOT IN ('PROCESSED', 'IGNORED') OR ${t.processedAt} IS NOT NULL`,
    ),
  ],
);
