import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { is } from "drizzle-orm";
import { PgTable, PgDialect, getTableConfig } from "drizzle-orm/pg-core";
import * as domain from "../src/server/db/schema";
import {
  basisPointsSchema,
  idrSchema,
  inputDefinitionSchema,
  safeEventSchema,
  settingValueSchema,
} from "../src/server/db/schema/validation";

const exports: unknown[] = Object.values(domain);
const tables = exports.filter((value): value is PgTable => is(value, PgTable));
const configs = tables.map(getTableConfig);
const dialect = new PgDialect();
const guards = readFileSync(
  new URL("../drizzle/0002_domain_guards.sql", import.meta.url),
  "utf8",
);

test("all domain tables are present with no duplicate table exports", () => {
  const expected =
    `foundation_metadata users password_credentials sessions roles permissions user_roles role_permissions customer_profiles membership_tiers membership_history categories brands products product_input_schemas providers provider_skus provider_health provider_syncs pricing_rules price_snapshots orders order_items order_status_history payments payment_events payment_event_processing provider_attempts provider_events provider_event_processing wallet_accounts ledger_entries promos promo_products promo_categories promo_tiers promo_usages snapshot_promos flash_sales flash_sale_items flash_sale_reservations referral_codes referral_events notifications audit_logs admin_notes cms_banners system_settings`.split(
      " ",
    );
  assert.deepEqual(configs.map((table) => table.name).sort(), expected.sort());
});

test("money uses bigint end to end and percentages are integers", () => {
  let moneyCount = 0;
  let percentageCount = 0;
  for (const table of configs)
    for (const column of table.columns) {
      if (column.name.endsWith("_idr")) {
        moneyCount++;
        assert.equal(
          column.getSQLType(),
          "bigint",
          `${table.name}.${column.name}`,
        );
        assert.equal(column.dataType, "bigint");
      }
      if (column.name.endsWith("_bps")) {
        percentageCount++;
        assert.equal(column.getSQLType(), "integer");
        assert.ok(
          table.checks.some((check) =>
            dialect.sqlToQuery(check.value).sql.includes(`"${column.name}"`),
          ),
        );
      }
    }
  assert.ok(moneyCount >= 20 && percentageCount >= 5);
  assert.equal(idrSchema.parse(9007199254740993n), 9007199254740993n);
  for (const invalid of [1.5, 20500, -1n, 9223372036854775808n])
    assert.equal(idrSchema.safeParse(invalid).success, false);
  for (const invalid of [-1, 1.5, 10001])
    assert.equal(basisPointsSchema.safeParse(invalid).success, false);
});

test("all foreign keys restrict deletion and identity rewrites", () => {
  let count = 0;
  for (const table of configs)
    for (const key of table.foreignKeys) {
      count++;
      assert.equal(key.onDelete, "restrict", `${table.name}.${key.getName()}`);
      assert.equal(key.onUpdate, "restrict");
    }
  assert.ok(count > 60);
});

test("structural identities and webhook deduplication are database unique", () => {
  for (const [table, columns] of [
    [domain.users, ["email_normalized"]],
    [domain.users, ["phone_normalized"]],
    [domain.products, ["slug"]],
    [domain.categories, ["slug"]],
    [domain.providers, ["code"]],
    [domain.providerSkus, ["provider_id", "external_sku"]],
    [domain.orders, ["public_reference"]],
    [domain.orders, ["idempotency_key"]],
    [domain.payments, ["gateway_code", "gateway_reference"]],
    [domain.paymentEvents, ["gateway_code", "event_key"]],
    [domain.providerAttempts, ["attempt_reference"]],
    [domain.providerEvents, ["provider_id", "event_key"]],
    [domain.ledgerEntries, ["idempotency_key"]],
    [domain.promos, ["code"]],
    [domain.referralCodes, ["code"]],
  ] as const) {
    const config = getTableConfig(table);
    const uniqueColumns = [
      ...config.columns
        .filter((column) => column.isUnique)
        .map((column) => [column.name]),
      ...config.uniqueConstraints.map((constraint) =>
        constraint.columns.map((column) => column.name),
      ),
    ];
    assert.ok(
      uniqueColumns.some((names) => names.join() === columns.join()),
      `${config.name}: ${columns.join()}`,
    );
  }
});

test("composite foreign keys prevent mismatched commercial associations", () => {
  for (const [table, names] of [
    [
      domain.providerAttempts,
      [
        "order_item_id,order_id,product_id",
        "provider_sku_id,provider_id,product_id",
      ],
    ],
    [domain.priceSnapshots, ["provider_sku_id,provider_id,product_id"]],
    [domain.payments, ["order_id,currency,amount_idr"]],
    [
      domain.ledgerEntries,
      [
        "wallet_account_id,currency",
        "corrects_entry_id,wallet_account_id,currency",
      ],
    ],
  ] as const) {
    const keys = getTableConfig(table).foreignKeys.map((key) =>
      key
        .reference()
        .columns.map((column) => column.name)
        .join(),
    );
    for (const name of names) assert.ok(keys.includes(name), name);
  }
});

test("order state vocabulary is exact and unresolved provider attempts cannot overlap", () => {
  assert.deepEqual(domain.orderStatus.enumValues, [
    "DRAFT",
    "WAITING_PAYMENT",
    "PAYMENT_PENDING",
    "PAID",
    "QUEUED",
    "PROCESSING",
    "PROVIDER_PENDING",
    "SUCCESS",
    "FAILED",
    "EXPIRED",
    "REFUND_PENDING",
    "REFUNDED",
    "MANUAL_REVIEW",
    "CANCELLED",
  ]);
  assert.ok(domain.providerAttemptStatus.enumValues.includes("PENDING"));
  assert.ok(domain.providerAttemptStatus.enumValues.includes("FAILED"));
  const guard = getTableConfig(domain.providerAttempts).indexes.find(
    (index) =>
      index.config.name === "attempt_one_unresolved_or_success_per_item",
  );
  assert.ok(guard?.config.unique && guard.config.where);
  const predicate = dialect.sqlToQuery(guard.config.where).sql;
  for (const status of ["CREATED", "SUBMITTED", "PENDING", "SUCCESS"])
    assert.ok(predicate.includes(`'${status}'`));
  assert.ok(!predicate.includes("'FAILED'"));
});

test("history has no mutable timestamps and custom DDL guards update, delete and truncate", () => {
  for (const name of [
    "membership_history",
    "product_input_schemas",
    "provider_health",
    "price_snapshots",
    "order_items",
    "order_status_history",
    "payment_events",
    "provider_events",
    "ledger_entries",
    "promo_usages",
    "snapshot_promos",
    "referral_events",
    "audit_logs",
    "admin_notes",
  ]) {
    const table = configs.find((config) => config.name === name);
    assert.ok(table);
    assert.ok(!table.columns.some((column) => column.name === "updated_at"));
    assert.ok(guards.includes(`'${name}'`));
  }
  assert.match(guards, /BEFORE UPDATE OR DELETE/);
  assert.match(guards, /BEFORE TRUNCATE/);
  assert.match(guards, /IS DISTINCT FROM/);
  assert.match(guards, /topuplab_guard_external_reference/);
});

test("provider and settings models have no credential columns; tiers are relational data", () => {
  for (const table of [
    domain.providers,
    domain.providerSkus,
    domain.systemSettings,
  ]) {
    for (const column of getTableConfig(table).columns)
      assert.doesNotMatch(
        column.name,
        /password|secret|api_key|access_token|authorization/,
      );
  }
  const tierForeignKeys = getTableConfig(
    domain.pricingRules,
  ).foreignKeys.filter(
    (key) => key.reference().foreignTable === domain.membershipTiers,
  );
  assert.equal(tierForeignKeys.length, 1);
  assert.equal(domain.membershipTiers.name.getSQLType(), "text");
  assert.equal(
    settingValueSchema.safeParse({
      key: "API_KEY",
      value: { secret: "test-only" },
    }).success,
    false,
  );
  assert.equal(
    settingValueSchema.safeParse({
      key: "CATALOG_PAGE_SIZE",
      value: { count: 24, secret: "test-only" },
    }).success,
    false,
  );
  assert.equal(
    safeEventSchema.safeParse({
      responseCode: "OK",
      authorization: "test-only",
    }).success,
    false,
  );
});

test("dynamic target definitions reject passwords, executable rules and duplicate fields", () => {
  const field = {
    key: "user_id",
    label: "ID pengguna",
    format: "DIGITS",
    required: true,
    minLength: 1,
    maxLength: 32,
  };
  assert.equal(
    inputDefinitionSchema.safeParse({ version: 1, fields: [field] }).success,
    true,
  );
  for (const fields of [
    [{ ...field, key: "password" }],
    [{ ...field, validate: "eval(input)" }],
    [field, field],
    [{ ...field, minLength: 40 }],
  ]) {
    assert.equal(
      inputDefinitionSchema.safeParse({ version: 1, fields }).success,
      false,
    );
  }
});
