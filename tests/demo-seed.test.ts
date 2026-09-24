import assert from "node:assert/strict";
import { test } from "node:test";
import { batches, fixtureHash } from "../scripts/seeds/demo/dataset";
import { guardDemoEnvironment } from "../scripts/seeds/demo/guard";
import { demoId, demoTime, schedules } from "../scripts/seeds/demo/shared";
import * as catalog from "../scripts/seeds/demo/catalog";
import * as providers from "../scripts/seeds/demo/providers";
import * as membership from "../scripts/seeds/demo/membership";
import * as promotions from "../scripts/seeds/demo/promotions";
import * as operations from "../scripts/seeds/demo/operations";
import {
  inputDefinitionSchema,
  productMetadataSchema,
  providerMetadataSchema,
  tierBenefitsSchema,
  settingValueSchema,
  idrSchema,
  basisPointsSchema,
} from "../src/server/db/schema/validation";

const safe = {
  NODE_ENV: "test",
  APP_MODE: "demo",
  APP_URL: "http://127.0.0.1:3000",
  DATABASE_URL:
    "postgresql://topuplab_local:test-only@127.0.0.1:55417/topuplab_demo_012345abcdef",
};
test("demo guard accepts only explicit local demo targets", () => {
  assert.equal(
    guardDemoEnvironment(safe).pathname,
    "/topuplab_demo_012345abcdef",
  );
  for (const override of [
    { NODE_ENV: "production" },
    { NODE_ENV: undefined },
    { APP_MODE: "live" },
    { APP_MODE: undefined },
    { APP_URL: "https://topuplab.example" },
    { VERCEL: "1" },
    { CI: "true" },
    ...["127.0.0.2", "localhost", "production.example"].map((host) => ({
      DATABASE_URL: safe.DATABASE_URL.replace("127.0.0.1", host),
    })),
    ...["5432", "55418"].map((port) => ({
      DATABASE_URL: safe.DATABASE_URL.replace("55417", port),
    })),
    ...["postgres", "topuplab", "topuplab_demo_production"].map((name) => ({
      DATABASE_URL: safe.DATABASE_URL.replace(
        "topuplab_demo_012345abcdef",
        name,
      ),
    })),
    { DATABASE_URL: `${safe.DATABASE_URL}?host=production.example` },
    { DATABASE_URL: `${safe.DATABASE_URL}#override` },
    { DATABASE_URL: "invalid" },
    { DATABASE_URL: safe.DATABASE_URL.replace("topuplab_local", "postgres") },
  ])
    assert.throws(() => guardDemoEnvironment({ ...safe, ...override }));
});
test("fixture IDs and keys are stable and unique", () => {
  assert.equal(
    demoId("product/mobile-legends-86"),
    demoId("product/mobile-legends-86"),
  );
  assert.notEqual(demoId("product/a"), demoId("category/a"));
  assert.match(
    demoId("a"),
    /^[a-f0-9]{8}-[a-f0-9]{4}-8[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
  );
  assert.match(fixtureHash, /^[a-f0-9]{64}$/);
  const ids = batches.flatMap(({ rows }) =>
    rows.flatMap((row) => ("id" in row ? [row.id] : [])),
  );
  assert.equal(new Set(ids).size, ids.length);
  for (const rows of [catalog.categories, catalog.brands, catalog.products])
    assert.equal(new Set(rows.map((row) => row.slug)).size, rows.length);
  assert.equal(
    new Set(
      providers.providerSkus.map(
        (row) => `${row.providerId}/${row.externalSku}`,
      ),
    ).size,
    providers.providerSkus.length,
  );
});
test("catalog contains all categories, games, denominations and safe target definitions", () => {
  assert.deepEqual(
    catalog.categories.map((row) => row.name),
    ["Game", "Pulsa", "Paket Data", "E-Wallet", "PLN", "Voucher", "Tagihan"],
  );
  assert.equal(catalog.products.length, 43);
  for (const name of [
    "Mobile Legends",
    "Free Fire",
    "PUBG Mobile",
    "Roblox",
    "Valorant",
    "Genshin Impact",
  ])
    assert.ok(catalog.brands.some((row) => row.name === name));
  for (const amount of [5, 12, 28, 59, 86, 172, 257, 344])
    assert.ok(
      catalog.products.some((p) => p.slug === `mobile-legends-${amount}`),
    );
  for (const amount of [5, 20, 50, 70, 140, 355])
    assert.ok(catalog.products.some((p) => p.slug === `free-fire-${amount}`));
  for (const input of catalog.inputSchemas) {
    const parsed = inputDefinitionSchema.parse(input.definition);
    for (const field of parsed.fields)
      assert.doesNotMatch(
        field.key + field.label,
        /password|kata sandi|otp|cookie|token/i,
      );
  }
  assert.throws(() =>
    inputDefinitionSchema.parse({
      ...catalog.inputSchemas[0]!.definition,
      password: "unsafe",
    }),
  );
  assert.equal(
    catalog.inputSchemas.find((row) => row.code === "DEMO_PHONE")!.definition
      .fields[0]!.format,
    "PHONE_E164",
  );
  for (const product of catalog.products) {
    productMetadataSchema.parse(product.metadata);
    assert.ok(catalog.categories.some((row) => row.id === product.categoryId));
    assert.ok(catalog.brands.some((row) => row.id === product.brandId));
    assert.ok(
      catalog.inputSchemas.some((row) => row.id === product.inputSchemaId),
    );
    assert.ok(product.metadata.tags?.includes("demo"));
  }
});
test("provider fixtures are fictional, unconfigured and have varied supply coverage", () => {
  assert.deepEqual(
    providers.providers.map((row) => row.displayName),
    ["Alpha Digital (Demo)", "Beta Supply (Demo)", "Gamma H2H (Demo)"],
  );
  for (const row of providers.providers) {
    assert.match(row.code, /^DEMO_/);
    assert.equal(row.configReference, null);
  }
  const coverage = new Set(
    catalog.products.map(
      (p) =>
        providers.providerSkus.filter((sku) => sku.productId === p.id).length,
    ),
  );
  assert.deepEqual([...coverage].sort(), [1, 2, 3]);
  assert.ok(providers.providerSkus.some((row) => !row.enabled));
  assert.ok(providers.providerSkus.some((row) => !row.available));
  for (const sku of providers.providerSkus) {
    idrSchema.parse(sku.costIdr);
    providerMetadataSchema.parse(sku.metadata);
    assert.ok(providers.providers.some((row) => row.id === sku.providerId));
    assert.ok(catalog.products.some((row) => row.id === sku.productId));
  }
  assert.deepEqual(
    new Set(providers.providerHealth.map((row) => row.state)),
    new Set(["HEALTHY", "DEGRADED", "OFFLINE", "PAUSED"]),
  );
  for (const row of providers.providerHealth) {
    for (const rate of [
      row.successRateBps,
      row.pendingRateBps,
      row.timeoutRateBps,
    ])
      if (rate !== null) basisPointsSchema.parse(rate);
    assert.equal(row.balanceIdr, null);
  }
});
test("membership is relational data with fictional identities and exact price configuration", () => {
  assert.deepEqual(
    membership.membershipTiers.map((row) => row.name),
    ["Public", "Member", "Gold", "Reseller"],
  );
  for (const tier of membership.membershipTiers)
    tierBenefitsSchema.parse(tier.benefits);
  for (const user of membership.users) {
    assert.match(user.emailNormalized!, /^demo\.[a-z]+@example\.invalid$/);
    assert.equal(user.phoneNormalized, undefined);
  }
  assert.equal(membership.profiles.length, 3);
  assert.equal(membership.membershipHistory.length, 3);
  for (const profile of membership.profiles)
    assert.ok(
      membership.membershipTiers.some(
        (tier) => tier.id === profile.membershipTierId,
      ),
    );
  assert.equal(membership.pricingRules.length, 6);
  for (const rule of membership.pricingRules) {
    idrSchema.parse(rule.fixedMarkupIdr);
    idrSchema.parse(rule.minimumMarginIdr);
    basisPointsSchema.parse(rule.markupBps);
  }
});
test("promotions have all four types, reference valid scopes and preserve fixed schedules", () => {
  assert.equal(new Set(promotions.promos.map((p) => p.type)).size, 4);
  assert.ok(
    schedules.active.startsAt < demoTime && schedules.active.endsAt > demoTime,
  );
  assert.ok(schedules.upcoming.startsAt > demoTime);
  assert.ok(schedules.expired.endsAt < demoTime);
  assert.ok(promotions.promos.some((p) => p.status === "PAUSED"));
  for (const p of promotions.promos) {
    assert.ok(p.startsAt < p.endsAt);
    if (p.fixedAmountIdr !== null) idrSchema.parse(p.fixedAmountIdr);
    if (p.discountBps !== null) basisPointsSchema.parse(p.discountBps);
  }
  for (const row of promotions.promoProducts)
    assert.ok(catalog.products.some((p) => p.id === row.productId));
  for (const row of promotions.promoCategories)
    assert.ok(catalog.categories.some((p) => p.id === row.categoryId));
  for (const row of promotions.promoTiers)
    assert.ok(membership.membershipTiers.some((p) => p.id === row.tierId));
  for (const item of promotions.flashSaleItems) {
    idrSchema.parse(item.priceIdr);
    assert.ok(item.perUserLimit <= item.quota);
    assert.ok(
      promotions.flashSales.some((sale) => sale.id === item.flashSaleId),
    );
  }
});
test("demo seed contains no credentials, financial history, balances or unsafe JSON settings", () => {
  const forbidden = [
    "orders",
    "order_items",
    "payments",
    "password_credentials",
    "sessions",
    "ledger_entries",
    "wallet_accounts",
    "price_snapshots",
    "provider_attempts",
    "promo_usages",
    "flash_sale_reservations",
    "referral_events",
  ];
  for (const table of forbidden)
    assert.ok(!batches.some((batch) => batch.name === table));
  for (const row of operations.settings)
    settingValueSchema.parse({ key: row.key, value: row.value });
  assert.equal(operations.settings.length, 3);
  assert.throws(() =>
    settingValueSchema.parse({ key: "API_KEY", value: { key: "unsafe" } }),
  );
  for (const banner of operations.banners) {
    assert.equal(banner.ctaPath, null);
    assert.match(banner.copy!, /demo|pengujian/i);
  }
  for (const { rows } of batches)
    for (const row of rows)
      for (const key of Object.keys(row))
        assert.doesNotMatch(
          key,
          /password|secret|tokenDigest|apiKey|endpoint/i,
        );
});
