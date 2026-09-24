import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Client } from "pg";
import { is, eq } from "drizzle-orm";
import { PgTable, getTableConfig, isPgEnum } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../src/server/db/schema";

type Row = Record<string, unknown>;
const identifier = (value: string) => {
  assert.match(value, /^[a-z_][a-z0-9_]*$/);
  return `"${value}"`;
};

export async function validateDomain(
  client: Client,
  record: (name: string) => void,
) {
  const exports: unknown[] = Object.values(schema);
  const tables = exports
    .filter((value): value is PgTable => is(value, PgTable))
    .map(getTableConfig);
  const enums = exports.filter(isPgEnum);
  assert.deepEqual(
    (
      await client.query(
        "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
      )
    ).rows.map((row) => row.tablename),
    tables.map((table) => table.name).sort(),
  );
  assert.equal(tables.length, 48);
  const enumRows = (
    await client.query(
      "SELECT t.typname, array_agg(e.enumlabel::text ORDER BY e.enumsortorder) AS labels FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' GROUP BY t.typname ORDER BY t.typname",
    )
  ).rows;
  assert.equal(enumRows.length, 25);
  for (const item of enums)
    assert.deepEqual(
      enumRows.find((row) => row.typname === item.enumName)?.labels,
      item.enumValues,
    );
  record(
    "all 48 tables and all 25 enums match Drizzle, including exact enum labels",
  );
  const numericColumns = (
    await client.query(
      "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND (column_name LIKE '%\\_idr' ESCAPE '\\' OR column_name LIKE '%\\_bps' ESCAPE '\\')",
    )
  ).rows;
  for (const column of numericColumns)
    assert.equal(
      column.data_type,
      column.column_name.endsWith("_idr") ? "bigint" : "integer",
    );
  record(
    `${numericColumns.length} monetary/basis-point columns have exact integer SQL types`,
  );
  const fixtures: Record<string, Row> = {};
  async function insert(table: string, values: Row, save = false) {
    const keys = Object.keys(values);
    const row = (
      await client.query(
        `INSERT INTO ${identifier(table)} (${keys.map(identifier).join(",")}) VALUES (${keys.map((_, index) => `$${index + 1}`).join(",")}) RETURNING *`,
        Object.values(values),
      )
    ).rows[0] as Row;
    if (save) fixtures[table] = row;
    return row;
  }
  async function reject(
    name: string,
    operation: () => Promise<unknown>,
    code: string,
    constraint?: string,
  ) {
    await client.query("SAVEPOINT rejection_probe");
    try {
      await assert.rejects(operation, (error: unknown) => {
        assert.ok(error && typeof error === "object" && "code" in error);
        assert.equal(error.code, code, name);
        if (constraint)
          assert.equal(
            (error as { constraint?: string }).constraint,
            constraint,
            name,
          );
        return true;
      });
      record(name);
    } finally {
      await client.query("ROLLBACK TO SAVEPOINT rejection_probe");
      await client.query("RELEASE SAVEPOINT rejection_probe");
    }
  }
  const clone = (table: string, changes: Row = {}) => ({
    ...fixtures[table],
    id: randomUUID(),
    ...changes,
  });
  await client.query("BEGIN");
  try {
    const user = await insert("users", {
      email_normalized: "phase3-a@example.invalid",
    });
    const otherUser = await insert("users", {
      email_normalized: "phase3-b@example.invalid",
    });
    const tier = await insert("membership_tiers", {
      code: "TEST",
      name: "Integration fixture",
      level: 1,
      benefits: { descriptions: [] },
    });
    await insert(
      "membership_history",
      {
        user_id: user.id,
        new_tier_id: tier.id,
        reason_code: "TEST",
        origin: "SYSTEM",
        effective_at: new Date(),
        idempotency_key: randomUUID(),
      },
      true,
    );
    const category = await insert("categories", {
      slug: "integration",
      name: "Integration fixture",
    });
    const input = await insert(
      "product_input_schemas",
      {
        code: "TEST",
        version: 1,
        definition: {
          version: 1,
          fields: [
            {
              key: "user_id",
              label: "ID",
              format: "DIGITS",
              required: true,
              minLength: 1,
              maxLength: 32,
            },
          ],
        },
      },
      true,
    );
    const product = await insert("products", {
      slug: "integration",
      name: "Integration fixture",
      category_id: category.id,
      input_schema_id: input.id,
    });
    const otherProduct = await insert("products", {
      slug: "integration-other",
      name: "Integration fixture",
      category_id: category.id,
      input_schema_id: input.id,
    });
    const provider = await insert("providers", {
      code: "TEST",
      display_name: "Integration fixture",
    });
    const otherProvider = await insert("providers", {
      code: "OTHER",
      display_name: "Integration fixture",
    });
    const sku = await insert(
      "provider_skus",
      {
        provider_id: provider.id,
        product_id: product.id,
        external_sku: "TEST",
        cost_idr: "10000",
      },
      true,
    );
    await insert(
      "provider_health",
      {
        provider_id: provider.id,
        state: "HEALTHY",
        checked_at: new Date(),
        success_rate_bps: 10000,
        pending_rate_bps: 0,
        timeout_rate_bps: 0,
        balance_idr: "20500",
      },
      true,
    );
    await insert(
      "pricing_rules",
      {
        name: "Integration fixture",
        scope: "GLOBAL",
        markup_bps: 250,
        fixed_markup_idr: "0",
        minimum_margin_idr: "0",
      },
      true,
    );
    const snapshot = await insert(
      "price_snapshots",
      {
        product_id: product.id,
        provider_id: provider.id,
        provider_sku_id: sku.id,
        provider_code_snapshot: "TEST",
        external_sku_snapshot: "TEST",
        provider_cost_idr: "10000",
        public_price_idr: "12000",
        tier_price_idr: "12000",
        markup_idr: "2000",
        markup_bps: 2000,
        promo_discount_idr: "1000",
        payment_fee_idr: "500",
        gateway_cost_idr: "100",
        cashback_idr: "0",
        final_amount_idr: "11500",
        expected_gross_margin_idr: "1400",
      },
      true,
    );
    const order = await insert(
      "orders",
      {
        idempotency_key: randomUUID(),
        customer_id: user.id,
        contact_email: "phase3-a@example.invalid",
        total_idr: "11500",
      },
      true,
    );
    const otherOrder = await insert("orders", {
      idempotency_key: randomUUID(),
      contact_email: "phase3-b@example.invalid",
      total_idr: "11500",
    });
    const item = await insert(
      "order_items",
      {
        order_id: order.id,
        line_number: 1,
        product_id: product.id,
        product_name_snapshot: "Integration fixture",
        product_slug_snapshot: "integration",
        input_schema_id: input.id,
        target_ciphertext: "test-only-not-a-real-target",
        target_key_reference: "TEST_ONLY",
        price_snapshot_id: snapshot.id,
        unit_final_amount_idr: "11500",
        line_total_idr: "11500",
      },
      true,
    );
    await insert(
      "order_status_history",
      {
        order_id: order.id,
        to_status: "DRAFT",
        source: "SYSTEM",
        reason_code: "TEST",
        correlation_id: randomUUID(),
        idempotency_key: randomUUID(),
        occurred_at: new Date(),
      },
      true,
    );
    const payment = await insert(
      "payments",
      {
        order_id: order.id,
        gateway_code: "TEST",
        idempotency_key: randomUUID(),
        method_code: "TEST",
        category: "QRIS",
        amount_idr: "11500",
      },
      true,
    );
    const paymentEvent = await insert(
      "payment_events",
      {
        payment_id: payment.id,
        order_id: order.id,
        gateway_code: "TEST",
        event_key: randomUUID(),
        event_type: "TEST",
        normalized_status: "PENDING",
        correlation_id: randomUUID(),
      },
      true,
    );
    await insert(
      "payment_event_processing",
      { event_id: paymentEvent.id },
      true,
    );
    const attempt = await insert(
      "provider_attempts",
      {
        order_id: order.id,
        order_item_id: item.id,
        product_id: product.id,
        provider_id: provider.id,
        provider_sku_id: sku.id,
        cost_idr: "10000",
      },
      true,
    );
    const providerEvent = await insert(
      "provider_events",
      {
        attempt_id: attempt.id,
        provider_id: provider.id,
        event_key: randomUUID(),
        event_type: "TEST",
        normalized_status: "PENDING",
        correlation_id: randomUUID(),
      },
      true,
    );
    await insert(
      "provider_event_processing",
      { event_id: providerEvent.id },
      true,
    );
    const wallet = await insert("wallet_accounts", { user_id: user.id }, true);
    const otherWallet = await insert("wallet_accounts", {
      user_id: otherUser.id,
    });
    const ledger = await insert(
      "ledger_entries",
      {
        wallet_account_id: wallet.id,
        idempotency_key: randomUUID(),
        journal_reference: randomUUID(),
        reference_type: "ADJUSTMENT",
        reference_id: randomUUID(),
        direction: "CREDIT",
        amount_idr: "20500",
        reason_code: "TEST",
        origin: "SYSTEM",
      },
      true,
    );
    const promo = await insert(
      "promos",
      {
        code: "TEST",
        name: "Integration fixture",
        type: "PERCENTAGE_DISCOUNT",
        discount_bps: 500,
        starts_at: "2026-01-01T00:00:00Z",
        ends_at: "2027-01-01T00:00:00Z",
      },
      true,
    );
    await insert(
      "promo_usages",
      {
        promo_id: promo.id,
        order_id: order.id,
        user_id: user.id,
        action: "RESERVED",
        amount_idr: "1000",
        idempotency_key: randomUUID(),
      },
      true,
    );
    await insert(
      "snapshot_promos",
      {
        snapshot_id: snapshot.id,
        promo_id: promo.id,
        promo_code_snapshot: "TEST",
        discount_idr: "1000",
      },
      true,
    );
    const flash = await insert("flash_sales", {
      name: "Integration fixture",
      starts_at: "2026-01-01T00:00:00Z",
      ends_at: "2027-01-01T00:00:00Z",
    });
    const flashItem = await insert(
      "flash_sale_items",
      {
        flash_sale_id: flash.id,
        product_id: product.id,
        price_idr: "11500",
        quota: 10,
        per_user_limit: 1,
      },
      true,
    );
    await insert(
      "flash_sale_reservations",
      {
        flash_sale_item_id: flashItem.id,
        order_id: order.id,
        user_id: user.id,
        quantity: 1,
        expires_at: "2027-01-01T00:00:00Z",
        idempotency_key: randomUUID(),
      },
      true,
    );
    const referral = await insert("referral_codes", {
      owner_id: user.id,
      code: "TEST",
    });
    await insert(
      "referral_events",
      {
        referral_code_id: referral.id,
        referrer_id: user.id,
        referred_user_id: otherUser.id,
        state: "REGISTERED",
        idempotency_key: randomUUID(),
      },
      true,
    );
    await insert(
      "audit_logs",
      {
        origin: "SYSTEM",
        action: "TEST",
        entity_type: "order",
        entity_id: order.id,
        request_id: randomUUID(),
      },
      true,
    );
    await insert(
      "admin_notes",
      {
        actor_id: user.id,
        order_id: order.id,
        note: "Integration assertion only",
      },
      true,
    );
    await insert(
      "notifications",
      {
        recipient_id: user.id,
        channel: "IN_APP",
        template_code: "TEST",
        title: "Integration fixture",
        message: "Integration assertion only",
        idempotency_key: randomUUID(),
      },
      true,
    );

    const history = [
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
    ];
    const mutable = [
      "orders",
      "payments",
      "provider_attempts",
      "wallet_accounts",
      "flash_sale_reservations",
      "payment_event_processing",
      "provider_event_processing",
    ];
    for (const table of history) {
      const key = table === "snapshot_promos" ? "snapshot_id" : "id";
      await reject(
        `${table}: UPDATE rejected by history trigger`,
        () =>
          client.query(
            `UPDATE ${identifier(table)} SET ${identifier(key)}=${identifier(key)}`,
          ),
        "23514",
      );
    }
    for (const table of [...history, ...mutable]) {
      await reject(
        `${table}: DELETE rejected`,
        () => client.query(`DELETE FROM ${identifier(table)}`),
        "23514",
      );
      // CASCADE includes dependent test tables so PostgreSQL reaches the truncate trigger.
      await reject(
        `${table}: TRUNCATE rejected`,
        () => client.query(`TRUNCATE ${identifier(table)} CASCADE`),
        "23514",
      );
    }
    for (const [table, set] of Object.entries({
      orders: "status='WAITING_PAYMENT', status_changed_at=now()",
      payments: "status='PENDING'",
      provider_attempts:
        "status='PENDING', submitted_at=now(), last_checked_at=now()",
      wallet_accounts: "status='SUSPENDED'",
      flash_sale_reservations: "state='SOLD'",
      payment_event_processing:
        "state='PROCESSED', attempt_count=1, processed_at=now()",
      provider_event_processing:
        "state='IGNORED', attempt_count=1, processed_at=now()",
    })) {
      assert.equal(
        (
          await client.query(
            `UPDATE ${identifier(table)} SET ${set} WHERE ${table.endsWith("_processing") ? '"event_id"' : '"id"'}=$1 RETURNING *`,
            [
              fixtures[table]?.[
                table.endsWith("_processing") ? "event_id" : "id"
              ],
            ],
          )
        ).rowCount,
        1,
      );
      record(`${table}: permitted lifecycle update succeeds`);
      const key = table.endsWith("_processing") ? "created_at" : "id";
      const change =
        key === "id" ? "gen_random_uuid()" : "created_at - interval '1 day'";
      await reject(
        `${table}: immutable identity/terms update rejected`,
        () =>
          client.query(
            `UPDATE ${identifier(table)} SET ${identifier(key)}=${change}`,
          ),
        "23514",
      );
    }
    for (const [table, column] of [
      ["payments", "gateway_reference"],
      ["provider_attempts", "provider_transaction_reference"],
    ] as const) {
      assert.equal(
        (
          await client.query(
            `UPDATE ${identifier(table)} SET ${identifier(column)}='TEST-REFERENCE'`,
          )
        ).rowCount,
        1,
      );
      await client.query(
        `UPDATE ${identifier(table)} SET ${identifier(column)}='TEST-REFERENCE'`,
      );
      record(
        `${table}: external reference first assignment and same-value update succeed`,
      );
      for (const value of ["CHANGED", null])
        await reject(
          `${table}: external reference cannot become ${value ?? "NULL"}`,
          () =>
            client.query(
              `UPDATE ${identifier(table)} SET ${identifier(column)}=$1`,
              [value],
            ),
          "23514",
        );
    }
    for (const [table, changes, constraint] of [
      [
        "price_snapshots",
        { product_id: otherProduct.id },
        "snapshot_sku_product_provider_fk",
      ],
      [
        "price_snapshots",
        { provider_id: otherProvider.id },
        "snapshot_sku_product_provider_fk",
      ],
      [
        "order_items",
        {
          line_number: 2,
          price_snapshot_id: (
            await insert("price_snapshots", clone("price_snapshots"))
          ).id,
          product_id: otherProduct.id,
        },
        "order_item_snapshot_terms_fk",
      ],
      [
        "payments",
        { idempotency_key: randomUUID(), amount_idr: "11501" },
        "payment_order_terms_fk",
      ],
      [
        "payment_events",
        { event_key: randomUUID(), order_id: otherOrder.id },
        "payment_event_payment_order_gateway_fk",
      ],
      [
        "provider_attempts",
        {
          attempt_reference: randomUUID(),
          order_id: otherOrder.id,
          status: "FAILED",
          terminal_at: new Date(),
        },
        "attempt_item_order_product_fk",
      ],
      [
        "provider_attempts",
        {
          attempt_reference: randomUUID(),
          provider_id: otherProvider.id,
          status: "FAILED",
          terminal_at: new Date(),
        },
        "attempt_sku_provider_product_fk",
      ],
      [
        "provider_events",
        { event_key: randomUUID(), provider_id: otherProvider.id },
        "provider_event_attempt_provider_fk",
      ],
      [
        "ledger_entries",
        {
          idempotency_key: randomUUID(),
          wallet_account_id: otherWallet.id,
          corrects_entry_id: ledger.id,
        },
        "ledger_correction_same_wallet_fk",
      ],
      [
        "referral_events",
        {
          idempotency_key: randomUUID(),
          referrer_id: otherUser.id,
          referred_user_id: null,
          state: "CLICKED",
        },
        "referral_event_code_owner_fk",
      ],
    ] as const)
      await reject(
        `${constraint}: mismatched association rejected`,
        () => insert(table, clone(table, changes)),
        "23503",
        constraint,
      );

    for (const table of [
      "orders",
      "payments",
      "ledger_entries",
      "membership_history",
      "order_status_history",
      "promo_usages",
      "flash_sale_reservations",
      "referral_events",
      "notifications",
    ]) {
      const changes: Row =
        table === "orders" ? { public_reference: randomUUID() } : {};
      await reject(
        `${table}: duplicate idempotency key rejected`,
        () => insert(table, clone(table, changes)),
        "23505",
      );
    }
    for (const table of ["payment_events", "provider_events", "provider_skus"])
      await reject(
        `${table}: duplicate external identity rejected`,
        () => insert(table, clone(table)),
        "23505",
      );
    await reject(
      "provider attempts: a pending attempt blocks another unresolved attempt",
      () =>
        insert(
          "provider_attempts",
          clone("provider_attempts", { attempt_reference: randomUUID() }),
        ),
      "23505",
      "attempt_one_unresolved_or_success_per_item",
    );
    await client.query(
      "UPDATE provider_attempts SET status='SUCCESS', terminal_at=now()",
    );
    await reject(
      "provider attempts: success blocks another fulfillment",
      () =>
        insert(
          "provider_attempts",
          clone("provider_attempts", { attempt_reference: randomUUID() }),
        ),
      "23505",
      "attempt_one_unresolved_or_success_per_item",
    );

    for (const [table, fixture] of Object.entries(fixtures)) {
      const key =
        "idempotency_key" in fixture
          ? "idempotency_key"
          : "event_key" in fixture
            ? "event_key"
            : null;
      if (!key) continue;
      for (const value of ["", "   ", "\t\r\n", "x".repeat(201)])
        await reject(
          `${table}: ${key} length ${value.length} rejected`,
          () => insert(table, clone(table, { [key]: value })),
          "23514",
          `${table}_${key}_length`,
        );
    }
    for (const column of numericColumns) {
      const table = column.table_name as string;
      const name = column.column_name as string;
      assert.ok(fixtures[table], `Missing numeric fixture ${table}`);
      if (
        name.endsWith("_idr") &&
        !["markup_idr", "expected_gross_margin_idr"].includes(name)
      ) {
        const value = { ...fixtures[table], [name]: "-1" };
        if ("id" in value) value.id = randomUUID();
        await reject(
          `${table}.${name}: negative money rejected`,
          () => insert(table, value),
          "23514",
        );
      }
      if (name.endsWith("_bps")) {
        const maximum = name === "markup_bps" ? 100000 : 10000;
        for (const invalid of [-1, maximum + 1])
          await reject(
            `${table}.${name}: ${invalid} rejected`,
            () => insert(table, clone(table, { [name]: invalid })),
            "23514",
          );
        await reject(
          `${table}.${name}: fractional parameter rejected`,
          () => insert(table, clone(table, { [name]: "1.5" })),
          "22P02",
        );
      }
    }
    for (const [column, constraint] of [
      ["final_amount_idr", "snapshot_final_equation"],
      ["markup_idr", "snapshot_markup_equation"],
      ["expected_gross_margin_idr", "snapshot_margin_equation"],
    ] as const)
      await reject(
        `${constraint}: inconsistent arithmetic rejected`,
        () =>
          insert(
            "price_snapshots",
            clone("price_snapshots", { [column]: "1" }),
          ),
        "23514",
        constraint,
      );
    await reject(
      "self referral rejected",
      () =>
        insert(
          "referral_events",
          clone("referral_events", {
            idempotency_key: randomUUID(),
            referred_user_id: user.id,
          }),
        ),
      "23514",
      "referral_not_self",
    );
    await reject(
      "referenced user cannot be deleted",
      () => client.query("DELETE FROM users WHERE id=$1", [user.id]),
      "23503",
    );

    for (const amount of [20500n, 9007199254740993n, 9223372036854775807n]) {
      const row = await insert(
        "ledger_entries",
        clone("ledger_entries", {
          idempotency_key: randomUUID(),
          amount_idr: amount.toString(),
        }),
      );
      const [typed] = await drizzle(client)
        .select({ amount: schema.ledgerEntries.amountIdr })
        .from(schema.ledgerEntries)
        .where(eq(schema.ledgerEntries.id, row.id as string));
      assert.ok(typed);
      assert.equal(typeof typed.amount, "bigint");
      assert.equal(typed.amount, amount);
      assert.equal(row.amount_idr, amount.toString());
      record(`IDR ${amount}: PostgreSQL and Drizzle bigint round-trip exactly`);
    }
    await reject(
      "bigint overflow rejected",
      () =>
        insert(
          "ledger_entries",
          clone("ledger_entries", {
            idempotency_key: randomUUID(),
            amount_idr: "9223372036854775808",
          }),
        ),
      "22003",
    );
    await reject(
      "fractional IDR parameter rejected",
      () =>
        insert(
          "ledger_entries",
          clone("ledger_entries", {
            idempotency_key: randomUUID(),
            amount_idr: "20.5",
          }),
        ),
      "22P02",
    );
    const high = "9223372036854775807";
    await insert(
      "price_snapshots",
      clone("price_snapshots", {
        provider_cost_idr: high,
        public_price_idr: high,
        tier_price_idr: high,
        markup_idr: "0",
        promo_discount_idr: high,
        payment_fee_idr: high,
        gateway_cost_idr: "0",
        cashback_idr: "0",
        final_amount_idr: high,
        expected_gross_margin_idr: "0",
      }),
    );
    record("snapshot arithmetic remains exact at signed bigint maximum");
    for (const rate of [0, 1, 10000]) {
      const row = await insert(
        "provider_health",
        clone("provider_health", { success_rate_bps: rate }),
      );
      assert.equal(row.success_rate_bps, rate);
    }
    record("basis-point boundary values round-trip exactly");
  } finally {
    await client.query("ROLLBACK");
  }
  for (const table of tables.filter(
    (table) => table.name !== "foundation_metadata",
  ))
    assert.equal(
      (
        await client.query(
          `SELECT count(*)::int AS count FROM ${identifier(table.name)}`,
        )
      ).rows[0].count,
      0,
      table.name,
    );
  record("all temporary fixtures rolled back; zero business/demo rows remain");
}
