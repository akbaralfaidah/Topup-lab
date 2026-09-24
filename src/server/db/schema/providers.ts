import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  boolean,
  integer,
  jsonb,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { providerHealthState, stockState, syncState, syncType } from "./enums";
import {
  id,
  instant,
  createdAt,
  timestamps,
  money,
  basisPoints,
  restrict,
  nonnegative,
  rateRange,
  schedule,
  objectJson,
} from "./shared";
import { products } from "./catalog";
import type { ProviderMetadata } from "./validation";

export const providers = pgTable(
  "providers",
  {
    id: id(),
    code: text("code").notNull().unique(),
    displayName: text("display_name").notNull(),
    enabled: boolean("enabled").default(false).notNull(),
    operationalState: providerHealthState("operational_state")
      .default("PAUSED")
      .notNull(),
    configReference: text("config_reference"),
    ...timestamps(),
  },
  (t) => [
    check(
      "provider_config_reference_format",
      sql`${t.configReference} ~ '^[A-Z][A-Z0-9_]{0,63}$'`,
    ),
  ],
);
export const providerSkus = pgTable(
  "provider_skus",
  {
    id: id(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, restrict),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, restrict),
    externalSku: text("external_sku").notNull(),
    costIdr: money("cost_idr").notNull(),
    available: boolean("available").default(false).notNull(),
    stockState: stockState("stock_state").default("UNKNOWN").notNull(),
    stockQuantity: integer("stock_quantity"),
    priority: integer("priority").default(100).notNull(),
    enabled: boolean("enabled").default(false).notNull(),
    lastSyncedAt: instant("last_synced_at"),
    metadata: jsonb("metadata").$type<ProviderMetadata>().default({}).notNull(),
    ...timestamps(),
  },
  (t) => [
    unique("provider_sku_external_unique").on(t.providerId, t.externalSku),
    unique("provider_sku_identity_unique").on(t.id, t.providerId, t.productId),
    index("provider_skus_product_priority_idx").on(t.productId, t.priority),
    nonnegative("provider_sku_cost_nonnegative", t.costIdr),
    nonnegative("provider_sku_stock_nonnegative", t.stockQuantity),
    nonnegative("provider_sku_priority_nonnegative", t.priority),
    objectJson("provider_sku_metadata_object", t.metadata),
  ],
);
export const providerHealth = pgTable(
  "provider_health",
  {
    id: id(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, restrict),
    state: providerHealthState("state").notNull(),
    latencyMs: integer("latency_ms"),
    successRateBps: basisPoints("success_rate_bps"),
    pendingRateBps: basisPoints("pending_rate_bps"),
    timeoutRateBps: basisPoints("timeout_rate_bps"),
    balanceIdr: money("balance_idr"),
    lastSuccessAt: instant("last_success_at"),
    lastFailureAt: instant("last_failure_at"),
    checkedAt: instant("checked_at").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("provider_health_provider_checked_idx").on(t.providerId, t.checkedAt),
    nonnegative("health_latency_nonnegative", t.latencyMs),
    nonnegative("health_balance_nonnegative", t.balanceIdr),
    rateRange("health_success_bps_range", t.successRateBps),
    rateRange("health_pending_bps_range", t.pendingRateBps),
    rateRange("health_timeout_bps_range", t.timeoutRateBps),
  ],
);
export const providerSyncs = pgTable(
  "provider_syncs",
  {
    id: id(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, restrict),
    type: syncType("type").notNull(),
    state: syncState("state").default("RUNNING").notNull(),
    startedAt: instant("started_at").defaultNow().notNull(),
    finishedAt: instant("finished_at"),
    rowsDiscovered: integer("rows_discovered").default(0).notNull(),
    rowsChanged: integer("rows_changed").default(0).notNull(),
    errorCode: text("error_code"),
    correlationId: uuid("correlation_id").notNull(),
    ...timestamps(),
  },
  (t) => [
    index("provider_syncs_provider_started_idx").on(t.providerId, t.startedAt),
    nonnegative("sync_discovered_nonnegative", t.rowsDiscovered),
    nonnegative("sync_changed_nonnegative", t.rowsChanged),
    schedule("sync_time_order", t.startedAt, t.finishedAt),
    check(
      "sync_terminal_timestamp",
      sql`(${t.state} = 'RUNNING' AND ${t.finishedAt} IS NULL) OR (${t.state} <> 'RUNNING' AND ${t.finishedAt} IS NOT NULL)`,
    ),
  ],
);
