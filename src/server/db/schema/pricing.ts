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
  foreignKey,
} from "drizzle-orm/pg-core";
import { pricingScope, currency } from "./enums";
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
import { categories, brands, products } from "./catalog";
import { providers, providerSkus } from "./providers";
import { membershipTiers } from "./auth";

export const pricingRules = pgTable(
  "pricing_rules",
  {
    id: id(),
    name: text("name").notNull(),
    scope: pricingScope("scope").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, restrict),
    brandId: uuid("brand_id").references(() => brands.id, restrict),
    productId: uuid("product_id").references(() => products.id, restrict),
    providerId: uuid("provider_id").references(() => providers.id, restrict),
    tierId: uuid("tier_id").references(() => membershipTiers.id, restrict),
    fixedMarkupIdr: money("fixed_markup_idr")
      .default(sql`0`)
      .notNull(),
    markupBps: basisPoints("markup_bps").default(0).notNull(),
    minimumMarginIdr: money("minimum_margin_idr")
      .default(sql`0`)
      .notNull(),
    active: boolean("active").default(false).notNull(),
    priority: integer("priority").default(100).notNull(),
    startsAt: instant("starts_at"),
    endsAt: instant("ends_at"),
    ...timestamps(),
  },
  (t) => [
    check(
      "pricing_scope_target",
      sql`((${t.scope} = 'GLOBAL' AND num_nonnulls(${t.categoryId}, ${t.brandId}, ${t.productId}, ${t.providerId}) = 0) OR (num_nonnulls(${t.categoryId}, ${t.brandId}, ${t.productId}, ${t.providerId}) = 1 AND ((${t.scope} = 'CATEGORY' AND ${t.categoryId} IS NOT NULL) OR (${t.scope} = 'BRAND' AND ${t.brandId} IS NOT NULL) OR (${t.scope} = 'PRODUCT' AND ${t.productId} IS NOT NULL) OR (${t.scope} = 'PROVIDER' AND ${t.providerId} IS NOT NULL))))`,
    ),
    index("pricing_scope_tier_priority_idx").on(t.scope, t.tierId, t.priority),
    index("pricing_category_idx").on(t.categoryId),
    index("pricing_brand_idx").on(t.brandId),
    index("pricing_product_idx").on(t.productId),
    index("pricing_provider_idx").on(t.providerId),
    nonnegative("pricing_fixed_nonnegative", t.fixedMarkupIdr),
    nonnegative("pricing_margin_nonnegative", t.minimumMarginIdr),
    rateRange("pricing_markup_bps_range", t.markupBps, 100000),
    schedule("pricing_schedule", t.startsAt, t.endsAt),
  ],
);
export const priceSnapshots = pgTable(
  "price_snapshots",
  {
    id: id(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, restrict),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, restrict),
    providerSkuId: uuid("provider_sku_id").notNull(),
    pricingRuleId: uuid("pricing_rule_id").references(
      () => pricingRules.id,
      restrict,
    ),
    tierId: uuid("tier_id").references(() => membershipTiers.id, restrict),
    ruleNameSnapshot: text("rule_name_snapshot"),
    tierNameSnapshot: text("tier_name_snapshot"),
    providerCodeSnapshot: text("provider_code_snapshot").notNull(),
    externalSkuSnapshot: text("external_sku_snapshot").notNull(),
    currency: currency("currency").default("IDR").notNull(),
    providerCostIdr: money("provider_cost_idr").notNull(),
    publicPriceIdr: money("public_price_idr").notNull(),
    tierPriceIdr: money("tier_price_idr").notNull(),
    markupIdr: money("markup_idr").notNull(),
    markupBps: basisPoints("markup_bps").notNull(),
    promoDiscountIdr: money("promo_discount_idr")
      .default(sql`0`)
      .notNull(),
    paymentFeeIdr: money("payment_fee_idr")
      .default(sql`0`)
      .notNull(),
    gatewayCostIdr: money("gateway_cost_idr")
      .default(sql`0`)
      .notNull(),
    cashbackIdr: money("cashback_idr")
      .default(sql`0`)
      .notNull(),
    finalAmountIdr: money("final_amount_idr").notNull(),
    expectedGrossMarginIdr: money("expected_gross_margin_idr").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "snapshot_sku_product_provider_fk",
      columns: [t.providerSkuId, t.providerId, t.productId],
      foreignColumns: [
        providerSkus.id,
        providerSkus.providerId,
        providerSkus.productId,
      ],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    unique("snapshot_item_terms_unique").on(
      t.id,
      t.productId,
      t.finalAmountIdr,
    ),
    index("snapshot_product_idx").on(t.productId),
    index("snapshot_provider_idx").on(t.providerId),
    index("snapshot_rule_idx").on(t.pricingRuleId),
    index("snapshot_tier_idx").on(t.tierId),
    index("snapshot_sku_idx").on(t.providerSkuId),
    nonnegative("snapshot_cost_nonnegative", t.providerCostIdr),
    nonnegative("snapshot_public_nonnegative", t.publicPriceIdr),
    nonnegative("snapshot_tier_nonnegative", t.tierPriceIdr),
    nonnegative("snapshot_discount_nonnegative", t.promoDiscountIdr),
    nonnegative("snapshot_fee_nonnegative", t.paymentFeeIdr),
    nonnegative("snapshot_gateway_cost_nonnegative", t.gatewayCostIdr),
    nonnegative("snapshot_cashback_nonnegative", t.cashbackIdr),
    nonnegative("snapshot_final_nonnegative", t.finalAmountIdr),
    rateRange("snapshot_markup_bps_range", t.markupBps, 100000),
    check(
      "snapshot_discount_limit",
      sql`${t.promoDiscountIdr} <= ${t.tierPriceIdr}`,
    ),
    check(
      "snapshot_final_equation",
      sql`${t.finalAmountIdr}::numeric = ${t.tierPriceIdr}::numeric - ${t.promoDiscountIdr}::numeric + ${t.paymentFeeIdr}::numeric`,
    ),
    check(
      "snapshot_markup_equation",
      sql`${t.markupIdr}::numeric = ${t.tierPriceIdr}::numeric - ${t.providerCostIdr}::numeric`,
    ),
    check(
      "snapshot_margin_equation",
      sql`${t.expectedGrossMarginIdr}::numeric = ${t.finalAmountIdr}::numeric - ${t.providerCostIdr}::numeric - ${t.gatewayCostIdr}::numeric - ${t.cashbackIdr}::numeric`,
    ),
  ],
);
