import assert from "node:assert/strict";
import test from "node:test";
import {
  addPaymentFee,
  calculateCustomerPrice,
  selectPricingRule,
  type PricingRule,
} from "../src/server/pricing/quote-math";

const base: PricingRule = {
  id: "global",
  scope: "GLOBAL",
  categoryId: null,
  brandId: null,
  productId: null,
  tierId: null,
  fixedMarkupIdr: 0n,
  markupBps: 0,
  minimumMarginIdr: 0n,
  active: true,
  priority: 100,
  startsAt: null,
  endsAt: null,
};
const context = {
  productId: "p",
  brandId: "b",
  categoryId: "c",
  tierId: "public",
  referenceTime: new Date("2026-09-24T05:00:00Z"),
};

test("bigint basis-point arithmetic rounds upward and preserves full precision", () => {
  assert.equal(calculateCustomerPrice(100n, base), 100n);
  assert.equal(calculateCustomerPrice(101n, { ...base, markupBps: 300 }), 105n);
  assert.equal(
    calculateCustomerPrice(101n, {
      ...base,
      fixedMarkupIdr: 7n,
      markupBps: 300,
    }),
    112n,
  );
  assert.equal(
    calculateCustomerPrice(101n, {
      ...base,
      minimumMarginIdr: 30n,
      markupBps: 300,
    }),
    131n,
  );
  assert.equal(calculateCustomerPrice(1n, { ...base, markupBps: 100000 }), 11n);
  assert.equal(
    calculateCustomerPrice(9007199254740993n, { ...base, markupBps: 1 }),
    9008099974666468n,
  );
  assert.equal(addPaymentFee(101n, 2500n), 2601n);
  assert.throws(() =>
    calculateCustomerPrice(9223372036854775807n, { ...base, markupBps: 1 }),
  );
});

test("scope, tier, priority, schedule, and disabled rules resolve deterministically", () => {
  const category = {
    ...base,
    id: "category",
    scope: "CATEGORY" as const,
    categoryId: "c",
  };
  const brand = { ...base, id: "brand", scope: "BRAND" as const, brandId: "b" };
  const product = {
    ...base,
    id: "product",
    scope: "PRODUCT" as const,
    productId: "p",
  };
  assert.equal(selectPricingRule([base], context)?.id, "global");
  assert.equal(selectPricingRule([base, category], context)?.id, "category");
  assert.equal(
    selectPricingRule([base, category, brand], context)?.id,
    "brand",
  );
  assert.equal(
    selectPricingRule([base, category, brand, product], context)?.id,
    "product",
  );
  assert.equal(
    selectPricingRule(
      [base, { ...base, id: "tier", tierId: "public" }],
      context,
    )?.id,
    "tier",
  );
  assert.equal(
    selectPricingRule([base, { ...base, id: "priority", priority: 1 }], context)
      ?.id,
    "priority",
  );
  assert.equal(
    selectPricingRule([base, { ...product, active: false }], context)?.id,
    "global",
  );
  assert.equal(
    selectPricingRule(
      [base, { ...product, startsAt: new Date("2026-09-25T00:00:00Z") }],
      context,
    )?.id,
    "global",
  );
  assert.equal(
    selectPricingRule(
      [base, { ...product, endsAt: context.referenceTime }],
      context,
    )?.id,
    "global",
  );
  assert.equal(
    selectPricingRule([base, { ...product, tierId: "gold" }], context)?.id,
    "global",
  );
  assert.equal(
    selectPricingRule([base, { ...product, scope: "PROVIDER" }], context)?.id,
    "global",
  );
});
