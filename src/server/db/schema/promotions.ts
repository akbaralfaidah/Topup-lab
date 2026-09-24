import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  boolean,
  integer,
  check,
  index,
  unique,
  primaryKey,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users, membershipTiers } from "./auth";
import { categories, products } from "./catalog";
import { orders } from "./orders";
import { priceSnapshots } from "./pricing";
import {
  publicationStatus,
  promoType,
  stackingBehavior,
  promoUsageAction,
  reservationState,
} from "./enums";
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
} from "./shared";

export const promos = pgTable(
  "promos",
  {
    id: id(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    type: promoType("type").notNull(),
    status: publicationStatus("status").default("DRAFT").notNull(),
    startsAt: instant("starts_at").notNull(),
    endsAt: instant("ends_at").notNull(),
    quota: integer("quota"),
    perUserLimit: integer("per_user_limit"),
    budgetIdr: money("budget_idr"),
    minimumPurchaseIdr: money("minimum_purchase_idr")
      .default(sql`0`)
      .notNull(),
    fixedAmountIdr: money("fixed_amount_idr"),
    discountBps: basisPoints("discount_bps"),
    maximumDiscountIdr: money("maximum_discount_idr"),
    firstOrderOnly: boolean("first_order_only").default(false).notNull(),
    stacking: stackingBehavior("stacking").default("EXCLUSIVE").notNull(),
    ...timestamps(),
  },
  (t) => [
    check("promo_code_normalized", sql`${t.code} ~ '^[A-Z0-9_-]{1,64}$'`),
    schedule("promo_schedule", t.startsAt, t.endsAt),
    check(
      "promo_positive_limits",
      sql`(${t.quota} IS NULL OR ${t.quota} > 0) AND (${t.perUserLimit} IS NULL OR ${t.perUserLimit} > 0)`,
    ),
    check(
      "promo_value_for_type",
      sql`(${t.type} IN ('FIXED_DISCOUNT', 'CASHBACK') AND ${t.fixedAmountIdr} IS NOT NULL AND ${t.fixedAmountIdr} > 0 AND ${t.discountBps} IS NULL) OR (${t.type} = 'PERCENTAGE_DISCOUNT' AND ${t.fixedAmountIdr} IS NULL AND ${t.discountBps} IS NOT NULL AND ${t.discountBps} > 0) OR (${t.type} = 'FREE_ADMIN_FEE' AND ${t.fixedAmountIdr} IS NULL AND ${t.discountBps} IS NULL)`,
    ),
    nonnegative("promo_budget_nonnegative", t.budgetIdr),
    nonnegative("promo_minimum_nonnegative", t.minimumPurchaseIdr),
    nonnegative("promo_maximum_nonnegative", t.maximumDiscountIdr),
    rateRange("promo_discount_bps_range", t.discountBps),
    index("promos_status_schedule_idx").on(t.status, t.startsAt, t.endsAt),
  ],
);
export const promoProducts = pgTable(
  "promo_products",
  {
    promoId: uuid("promo_id")
      .notNull()
      .references(() => promos.id, restrict),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, restrict),
  },
  (t) => [
    primaryKey({ columns: [t.promoId, t.productId] }),
    index("promo_products_product_idx").on(t.productId),
  ],
);
export const promoCategories = pgTable(
  "promo_categories",
  {
    promoId: uuid("promo_id")
      .notNull()
      .references(() => promos.id, restrict),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, restrict),
  },
  (t) => [
    primaryKey({ columns: [t.promoId, t.categoryId] }),
    index("promo_categories_category_idx").on(t.categoryId),
  ],
);
export const promoTiers = pgTable(
  "promo_tiers",
  {
    promoId: uuid("promo_id")
      .notNull()
      .references(() => promos.id, restrict),
    tierId: uuid("tier_id")
      .notNull()
      .references(() => membershipTiers.id, restrict),
  },
  (t) => [
    primaryKey({ columns: [t.promoId, t.tierId] }),
    index("promo_tiers_tier_idx").on(t.tierId),
  ],
);
export const promoUsages = pgTable(
  "promo_usages",
  {
    id: id(),
    promoId: uuid("promo_id")
      .notNull()
      .references(() => promos.id, restrict),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, restrict),
    userId: uuid("user_id").references(() => users.id, restrict),
    action: promoUsageAction("action").notNull(),
    amountIdr: money("amount_idr").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("promo_usage_order_action_unique").on(
      t.promoId,
      t.orderId,
      t.action,
    ),
    index("promo_usage_user_date_idx").on(t.promoId, t.userId, t.createdAt),
    index("promo_usage_order_idx").on(t.orderId),
    nonnegative("promo_usage_amount_nonnegative", t.amountIdr),
  ],
);
export const flashSales = pgTable(
  "flash_sales",
  {
    id: id(),
    name: text("name").notNull(),
    status: publicationStatus("status").default("DRAFT").notNull(),
    startsAt: instant("starts_at").notNull(),
    endsAt: instant("ends_at").notNull(),
    ...timestamps(),
  },
  (t) => [
    schedule("flash_sale_schedule", t.startsAt, t.endsAt),
    index("flash_sales_status_schedule_idx").on(t.status, t.startsAt, t.endsAt),
  ],
);
export const flashSaleItems = pgTable(
  "flash_sale_items",
  {
    id: id(),
    flashSaleId: uuid("flash_sale_id")
      .notNull()
      .references(() => flashSales.id, restrict),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, restrict),
    priceIdr: money("price_idr").notNull(),
    quota: integer("quota").notNull(),
    perUserLimit: integer("per_user_limit").notNull(),
    ...timestamps(),
  },
  (t) => [
    unique("flash_sale_product_unique").on(t.flashSaleId, t.productId),
    index("flash_items_product_idx").on(t.productId),
    check(
      "flash_item_limits",
      sql`${t.quota} > 0 AND ${t.perUserLimit} > 0 AND ${t.perUserLimit} <= ${t.quota}`,
    ),
    nonnegative("flash_price_nonnegative", t.priceIdr),
  ],
);
export const flashSaleReservations = pgTable(
  "flash_sale_reservations",
  {
    id: id(),
    flashSaleItemId: uuid("flash_sale_item_id")
      .notNull()
      .references(() => flashSaleItems.id, restrict),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, restrict),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, restrict),
    quantity: integer("quantity").notNull(),
    state: reservationState("state").default("RESERVED").notNull(),
    expiresAt: instant("expires_at").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    ...timestamps(),
  },
  (t) => [
    unique("flash_reservation_order_unique").on(t.flashSaleItemId, t.orderId),
    index("flash_reservation_user_state_idx").on(
      t.flashSaleItemId,
      t.userId,
      t.state,
    ),
    index("flash_reservation_expiry_idx").on(t.state, t.expiresAt),
    index("flash_reservation_order_idx").on(t.orderId),
    check("flash_reservation_quantity_positive", sql`${t.quantity} > 0`),
  ],
);
export const snapshotPromos = pgTable(
  "snapshot_promos",
  {
    snapshotId: uuid("snapshot_id").notNull(),
    promoId: uuid("promo_id")
      .notNull()
      .references(() => promos.id, restrict),
    promoCodeSnapshot: text("promo_code_snapshot").notNull(),
    discountIdr: money("discount_idr").notNull(),
    cashbackIdr: money("cashback_idr")
      .default(sql`0`)
      .notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.snapshotId, t.promoId] }),
    foreignKey({
      name: "snapshot_promo_snapshot_fk",
      columns: [t.snapshotId],
      foreignColumns: [priceSnapshots.id],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    index("snapshot_promos_promo_idx").on(t.promoId),
    nonnegative("snapshot_promo_discount_nonnegative", t.discountIdr),
    nonnegative("snapshot_promo_cashback_nonnegative", t.cashbackIdr),
  ],
);
