import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  check,
  index,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import { orderStatus, actorOrigin, currency } from "./enums";
import {
  id,
  instant,
  createdAt,
  timestamps,
  money,
  restrict,
  nonnegative,
} from "./shared";
import { users } from "./auth";
import { products, productInputSchemas } from "./catalog";
import { priceSnapshots } from "./pricing";

export const orders = pgTable(
  "orders",
  {
    id: id(),
    publicReference: uuid("public_reference")
      .defaultRandom()
      .notNull()
      .unique(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    customerId: uuid("customer_id").references(() => users.id, restrict),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    currency: currency("currency").default("IDR").notNull(),
    totalIdr: money("total_idr").notNull(),
    status: orderStatus("status").default("DRAFT").notNull(),
    statusChangedAt: instant("status_changed_at").defaultNow().notNull(),
    expiresAt: instant("expires_at"),
    ...timestamps(),
  },
  (t) => [
    unique("orders_payment_terms_unique").on(t.id, t.currency, t.totalIdr),
    index("orders_customer_created_idx").on(t.customerId, t.createdAt),
    index("orders_status_created_idx").on(t.status, t.createdAt),
    nonnegative("order_total_nonnegative", t.totalIdr),
    check(
      "order_contact_required",
      sql`${t.contactEmail} IS NOT NULL OR ${t.contactPhone} IS NOT NULL`,
    ),
  ],
);
export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, restrict),
    lineNumber: integer("line_number").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, restrict),
    productNameSnapshot: text("product_name_snapshot").notNull(),
    productSlugSnapshot: text("product_slug_snapshot").notNull(),
    inputSchemaId: uuid("input_schema_id")
      .notNull()
      .references(() => productInputSchemas.id, restrict),
    targetCiphertext: text("target_ciphertext").notNull(),
    targetKeyReference: text("target_key_reference").notNull(),
    priceSnapshotId: uuid("price_snapshot_id").notNull().unique(),
    quantity: integer("quantity").default(1).notNull(),
    unitFinalAmountIdr: money("unit_final_amount_idr").notNull(),
    lineTotalIdr: money("line_total_idr").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("order_item_line_unique").on(t.orderId, t.lineNumber),
    unique("order_item_attempt_identity_unique").on(
      t.id,
      t.orderId,
      t.productId,
    ),
    foreignKey({
      name: "order_item_snapshot_terms_fk",
      columns: [t.priceSnapshotId, t.productId, t.unitFinalAmountIdr],
      foreignColumns: [
        priceSnapshots.id,
        priceSnapshots.productId,
        priceSnapshots.finalAmountIdr,
      ],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    index("order_items_product_idx").on(t.productId),
    index("order_items_input_idx").on(t.inputSchemaId),
    check(
      "order_item_positive_counts",
      sql`${t.quantity} > 0 AND ${t.lineNumber} > 0`,
    ),
    check(
      "order_item_total_equation",
      sql`${t.lineTotalIdr}::numeric = ${t.unitFinalAmountIdr}::numeric * ${t.quantity}::numeric`,
    ),
    nonnegative("order_item_total_nonnegative", t.lineTotalIdr),
  ],
);
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, restrict),
    fromStatus: orderStatus("from_status"),
    toStatus: orderStatus("to_status").notNull(),
    source: actorOrigin("source").notNull(),
    reasonCode: text("reason_code").notNull(),
    actorId: uuid("actor_id").references(() => users.id, restrict),
    correlationId: uuid("correlation_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    occurredAt: instant("occurred_at").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("order_history_order_occurred_idx").on(t.orderId, t.occurredAt),
    check(
      "order_history_state_changed",
      sql`${t.fromStatus} IS DISTINCT FROM ${t.toStatus}`,
    ),
  ],
);
