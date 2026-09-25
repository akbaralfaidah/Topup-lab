import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePricing,
  classifyCostFreshness,
  PricingConflictError,
  type PricingRule,
} from "../src/server/pricing/quote-math";
import {
  parsePercentage,
  parseRuleInput,
  windowsOverlap,
} from "../src/server/pricing/rule-input";

const rule: PricingRule = {
  id: "global",
  name: "Global",
  scope: "GLOBAL",
  categoryId: null,
  brandId: null,
  productId: null,
  providerId: null,
  tierId: null,
  fixedMarkupIdr: 1500n,
  markupBps: 300,
  minimumMarginIdr: 500n,
  active: true,
  priority: 100,
  startsAt: null,
  endsAt: null,
};
const context = {
  productId: "p",
  categoryId: "c",
  brandId: "b",
  providerId: "v",
  tierId: "public",
  referenceTime: new Date("2026-09-24T05:00:00Z"),
};

test("one pricing path resolves commercial scope, tier and provider floor", () => {
  const category = {
    ...rule,
    id: "category",
    scope: "CATEGORY" as const,
    categoryId: "c",
    fixedMarkupIdr: 1000n,
  };
  const brand = {
    ...rule,
    id: "brand",
    scope: "BRAND" as const,
    brandId: "b",
    fixedMarkupIdr: 900n,
  };
  const product = {
    ...rule,
    id: "product",
    scope: "PRODUCT" as const,
    productId: "p",
    fixedMarkupIdr: 800n,
  };
  const provider = {
    ...rule,
    id: "provider",
    scope: "PROVIDER" as const,
    providerId: "v",
    fixedMarkupIdr: 3000n,
  };
  const result = calculatePricing(
    10000n,
    [rule, category, brand, product, provider],
    context,
  );
  assert.equal(result?.commercialRule.id, "product");
  assert.equal(result?.providerFloorRule?.id, "provider");
  assert.equal(result?.sellingPriceIdr, 13300n);
  assert.equal(result?.expectedMarginIdr, 3300n);
  assert.equal(
    calculatePricing(10000n, [rule, category, brand, product], context)
      ?.sellingPriceIdr,
    11100n,
  );
  assert.equal(
    calculatePricing(10000n, [rule], context)?.sellingPriceIdr,
    11800n,
  );
});

test("exact tier beats neutral, priority wins within tier, and collision fails closed", () => {
  const tier = { ...rule, id: "tier", tierId: "public", priority: 200 };
  const priority = { ...tier, id: "priority", priority: 1 };
  assert.equal(
    calculatePricing(100n, [rule, tier], context)?.commercialRule.id,
    "tier",
  );
  assert.equal(
    calculatePricing(100n, [rule, tier, priority], context)?.commercialRule.id,
    "priority",
  );
  assert.throws(
    () => calculatePricing(100n, [rule, { ...rule, id: "collision" }], context),
    PricingConflictError,
  );
  assert.equal(
    calculatePricing(100n, [{ ...rule, active: false }], context),
    null,
  );
  assert.equal(
    calculatePricing(
      100n,
      [{ ...rule, startsAt: new Date("2026-09-25") }],
      context,
    ),
    null,
  );
  assert.equal(
    calculatePricing(
      100n,
      [{ ...rule, endsAt: context.referenceTime }],
      context,
    ),
    null,
  );
  assert.throws(() =>
    calculatePricing(
      100n,
      [
        {
          ...rule,
          startsAt: new Date("2026-09-26"),
          endsAt: new Date("2026-09-25"),
        },
      ],
      context,
    ),
  );
});

test("minimum margin, zero, large values and bounded matrix never sell at a loss", () => {
  const min = {
    ...rule,
    fixedMarkupIdr: 0n,
    markupBps: 1,
    minimumMarginIdr: 999n,
  };
  assert.equal(calculatePricing(1n, [min], context)?.sellingPriceIdr, 1000n);
  assert.equal(
    calculatePricing(
      0n,
      [{ ...rule, fixedMarkupIdr: 0n, markupBps: 0, minimumMarginIdr: 0n }],
      context,
    )?.sellingPriceIdr,
    0n,
  );
  assert.equal(
    calculatePricing(
      9007199254740993n,
      [{ ...rule, fixedMarkupIdr: 0n, markupBps: 1, minimumMarginIdr: 0n }],
      context,
    )?.sellingPriceIdr,
    9008099974666468n,
  );
  for (const cost of [0n, 1n, 99n, 5000n, 999999999999n])
    for (const bps of [0, 1, 750, 10000, 100000]) {
      const result = calculatePricing(
        cost,
        [
          {
            ...rule,
            fixedMarkupIdr: 0n,
            markupBps: bps,
            minimumMarginIdr: 500n,
          },
        ],
        context,
      )!;
      assert.ok(result.sellingPriceIdr >= cost);
      assert.ok(result.expectedMarginIdr >= 500n);
    }
  assert.throws(() =>
    calculatePricing(1n, [{ ...rule, fixedMarkupIdr: -1n }], context),
  );
  assert.throws(() => calculatePricing(9223372036854775807n, [rule], context));
});

test("admin parses exact percentage and integer money without floating point", () => {
  assert.equal(parsePercentage("7.5"), 750);
  assert.equal(parsePercentage("0.01"), 1);
  assert.equal(parsePercentage("1000"), 100000);
  for (const value of ["7.555", "1e2", "1,5", "-1", "1000.01"])
    assert.throws(() => parsePercentage(value));
  const draft = {
    id: null,
    version: null,
    name: "Aturan contoh",
    scope: "GLOBAL",
    targetId: null,
    tierId: null,
    fixedMarkupIdr: "9223372036854775807",
    percentage: "7.5",
    minimumMarginIdr: "0",
    priority: 100,
    startsAt: null,
    endsAt: null,
    active: false,
  };
  assert.equal(parseRuleInput(draft).fixedMarkupIdr, 9223372036854775807n);
  for (const amount of ["1.5", "1,000", "1e3", "-1", "9223372036854775808"])
    assert.throws(() => parseRuleInput({ ...draft, fixedMarkupIdr: amount }));
  assert.throws(() => parseRuleInput({ ...draft, scope: "PRODUCT" }));
});

test("schedule overlap uses inclusive start and exclusive end", () => {
  const first = {
    startsAt: new Date("2026-01-01"),
    endsAt: new Date("2026-02-01"),
  };
  assert.equal(
    windowsOverlap(first, { startsAt: new Date("2026-02-01"), endsAt: null }),
    false,
  );
  assert.equal(
    windowsOverlap(first, { startsAt: new Date("2026-01-31"), endsAt: null }),
    true,
  );
});

test("provider cost freshness distinguishes missing, stale and future timestamps", () => {
  const at = new Date("2026-09-24T05:00:00Z");
  assert.equal(classifyCostFreshness(null, at), "unknown");
  assert.equal(
    classifyCostFreshness(new Date("2026-09-24T04:59:00Z"), at),
    "recent",
  );
  assert.equal(
    classifyCostFreshness(new Date("2026-09-15T05:00:00Z"), at),
    "stale",
  );
  assert.equal(
    classifyCostFreshness(new Date("2026-09-25T05:00:00Z"), at),
    "future",
  );
});
