import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { Client } from "pg";
import { batches } from "./seeds/demo/dataset";
import { seedDemo } from "./seeds/demo/seed";
import { demoId } from "./seeds/demo/shared";
import {
  inputDefinitionSchema,
  productMetadataSchema,
  providerMetadataSchema,
  tierBenefitsSchema,
  settingValueSchema,
} from "../src/server/db/schema/validation";

const config = JSON.parse(
  readFileSync("runtime/postgresql17/local.json", "utf8"),
) as { adminUrl: string };
const adminUrl = new URL(config.adminUrl);
assert.equal(adminUrl.hostname, "127.0.0.1");
assert.equal(adminUrl.port, "55417");
assert.equal(adminUrl.pathname, "/postgres");
assert.equal(adminUrl.username, "topuplab_local");
assert.equal(adminUrl.search, "");
assert.equal(adminUrl.hash, "");
const npm = process.env.npm_execpath;
assert.ok(npm, "Run through npm run db:validate:demo");
const admin = new Client({
  connectionString: adminUrl.href,
  connectionTimeoutMillis: 3000,
});
const results: string[] = [];
const databases: string[] = [];
const record = (message: string) => {
  results.push(message);
  console.info(`PASS ${message}`);
};
function environment(url: URL): NodeJS.ProcessEnv {
  return {
    ...process.env,
    NODE_ENV: "test",
    APP_MODE: "demo",
    APP_URL: "http://127.0.0.1:3000",
    DATABASE_URL: url.href,
    REDIS_URL: "redis://127.0.0.1:6379",
  };
}
function command(
  task: string,
  url: URL,
  expected = 0,
  override: Partial<NodeJS.ProcessEnv> = {},
) {
  assert.match(url.pathname, /^\/topuplab_demo_[a-f0-9]{12}$/);
  const result = spawnSync(process.execPath, [npm!, "run", task], {
    env: { ...environment(url), ...override },
    encoding: "utf8",
    timeout: 90000,
    windowsHide: true,
  });
  assert.equal(
    result.status,
    expected,
    `${task} returned an unexpected exit status. ${result.stdout.replaceAll(url.href, "[local database]")} ${result.stderr.replaceAll(url.href, "[local database]")}`,
  );
}
async function fresh() {
  const name = `topuplab_demo_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  assert.match(name, /^topuplab_demo_[a-f0-9]{12}$/);
  await admin.query(`CREATE DATABASE "${name}"`);
  databases.push(name);
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  command("db:migrate", url);
  command("db:seed", url);
  const client = new Client({ connectionString: url.href });
  await client.connect();
  return { url, client };
}
async function snapshot(client: Client) {
  await client.query("SET TIME ZONE 'UTC'");
  const names = (
    await client.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
    )
  ).rows;
  const data: Record<string, string[]> = {};
  for (const { tablename } of names) {
    assert.match(tablename, /^[a-z_]+$/);
    data[tablename] = (
      await client.query<{ row: string }>(
        `SELECT row_to_json(t)::text AS row FROM "${tablename}" t ORDER BY row_to_json(t)::text`,
      )
    ).rows.map((row) => row.row);
  }
  return data;
}
try {
  await admin.connect();
  const version = (await admin.query("SHOW server_version_num")).rows[0]
    .server_version_num;
  assert.ok(Number(version) >= 170000 && Number(version) < 180000);
  assert.equal(
    (await admin.query("SHOW listen_addresses")).rows[0].listen_addresses,
    "127.0.0.1",
  );
  await admin.query(
    "CREATE TEMP TABLE phase4_time_probe (instant timestamptz NOT NULL)",
  );
  await admin.query(
    "INSERT INTO phase4_time_probe VALUES ('2026-09-24T05:00:00Z')",
  );
  const beforeEpoch = (
    await admin.query(
      "SELECT extract(epoch FROM instant)::text AS epoch FROM phase4_time_probe",
    )
  ).rows;
  await admin.query("ALTER SYSTEM SET timezone = 'Asia/Jakarta'");
  await admin.query("SELECT pg_reload_conf()");
  await admin.query("SET TIME ZONE 'Asia/Jakarta'");
  assert.deepEqual(
    (
      await admin.query(
        "SELECT extract(epoch FROM instant)::text AS epoch FROM phase4_time_probe",
      )
    ).rows,
    beforeEpoch,
  );
  record(
    "local timezone changed to Asia/Jakarta; stored timestamptz instant unchanged",
  );
  const { client, url } = await fresh();
  try {
    assert.equal(
      (await client.query("SHOW timezone")).rows[0].TimeZone,
      "Asia/Jakarta",
    );
    const journal = (
      await client.query(
        "SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at",
      )
    ).rows;
    const expected = JSON.parse(
      readFileSync("drizzle/meta/_journal.json", "utf8"),
    ) as { entries: { tag: string; when: number }[] };
    assert.deepEqual(
      journal,
      expected.entries.map((entry) => ({
        hash: createHash("sha256")
          .update(readFileSync(`drizzle/${entry.tag}.sql`))
          .digest("hex"),
        created_at: String(entry.when),
      })),
    );
    command("db:migrate", url);
    assert.deepEqual(
      (
        await client.query(
          "SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at",
        )
      ).rows,
      journal,
    );
    record(
      "fresh database migrated through 0003; repeat migration preserves journal",
    );
    const technical = await snapshot(client);
    command("db:seed", url);
    assert.deepEqual(await snapshot(client), technical);
    assert.ok(
      Object.entries(technical).every(
        ([name, rows]) =>
          rows.length === (name === "foundation_metadata" ? 1 : 0),
      ),
    );
    record("technical seed repeated unchanged with zero domain records");
    command("db:seed:demo", url, 1, { APP_MODE: "live" });
    command("db:seed:demo", url, 1, { NODE_ENV: "production" });
    assert.deepEqual(await snapshot(client), technical);
    record("CLI rejects live and production mode without writing");
    command("db:seed:demo", url);
    const first = await snapshot(client);
    command("db:seed:demo", url);
    assert.deepEqual(await snapshot(client), first);
    record(
      "demo seed twice preserves every row, timestamp, identity and immutable observation",
    );
    const concurrent = await Promise.all([
      seedDemo(environment(url)),
      seedDemo(environment(url)),
    ]);
    assert.ok(concurrent.every((run) => run.action === "verified"));
    assert.deepEqual(await snapshot(client), first);
    record("concurrent repeat seeds serialize and make no changes");
    for (const [name, rows] of Object.entries(first)) {
      if (name === "foundation_metadata") continue;
      assert.equal(
        rows.length,
        batches.find((batch) => batch.name === name)?.rows.length ?? 0,
        name,
      );
    }
    record(
      "all 47 domain table counts match fixture inventory; unseeded financial and credential tables stay empty",
    );
    for (const row of (
      await client.query("SELECT definition FROM product_input_schemas")
    ).rows)
      inputDefinitionSchema.parse(row.definition);
    for (const row of (await client.query("SELECT metadata FROM products"))
      .rows)
      productMetadataSchema.parse(row.metadata);
    for (const row of (await client.query("SELECT metadata FROM provider_skus"))
      .rows)
      providerMetadataSchema.parse(row.metadata);
    for (const row of (
      await client.query("SELECT benefits FROM membership_tiers")
    ).rows)
      tierBenefitsSchema.parse(row.benefits);
    for (const row of (
      await client.query("SELECT key, value FROM system_settings")
    ).rows)
      settingValueSchema.parse(row);
    record("every persisted JSON fixture passes its strict Phase 3 Zod schema");
    const mappings = (
      await client.query(
        "SELECT s.cost_idr::text AS cost, pg_typeof(s.cost_idr)::text AS type FROM provider_skus s JOIN providers p ON p.id=s.provider_id JOIN products c ON c.id=s.product_id",
      )
    ).rows;
    assert.equal(
      mappings.length,
      batches.find((batch) => batch.name === "provider_skus")!.rows.length,
    );
    assert.ok(
      mappings.every((row) => row.type === "bigint" && BigInt(row.cost) >= 0n),
    );
    assert.equal(
      (
        await client.query(
          "SELECT count(*)::int AS count FROM providers WHERE config_reference IS NOT NULL OR code NOT LIKE 'DEMO_%'",
        )
      ).rows[0].count,
      0,
    );
    assert.equal(
      (
        await client.query(
          "SELECT count(*)::int AS count FROM pricing_rules WHERE markup_bps < 0 OR markup_bps > 100000 OR pg_typeof(markup_bps)::text <> 'integer'",
        )
      ).rows[0].count,
      0,
    );
    record(
      "provider mappings join correctly; exact bigint costs and integer basis points; no provider secrets",
    );
    await client.query("BEGIN");
    try {
      for (const table of [
        "product_input_schemas",
        "provider_health",
        "membership_history",
      ]) {
        for (const statement of [
          `UPDATE ${table} SET id=id`,
          `DELETE FROM ${table}`,
          `TRUNCATE ${table} CASCADE`,
        ]) {
          await client.query("SAVEPOINT demo_guard");
          await assert.rejects(
            client.query(statement),
            (error: unknown) =>
              typeof error === "object" &&
              error !== null &&
              "code" in error &&
              error.code === "23514",
          );
          await client.query("ROLLBACK TO SAVEPOINT demo_guard");
        }
      }
    } finally {
      await client.query("ROLLBACK");
    }
    assert.deepEqual(await snapshot(client), first);
    record("immutable seeded tables still reject UPDATE, DELETE and TRUNCATE");
    mkdirSync("artifacts", { recursive: true });
    writeFileSync(
      "artifacts/phase4-inventory.json",
      JSON.stringify(
        Object.fromEntries(
          Object.entries(first).map(([name, rows]) => [name, rows.length]),
        ),
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }

  const recovery = await fresh();
  try {
    const initial = await snapshot(recovery.client);
    await recovery.client.query(
      "CREATE FUNCTION phase4_fail_seed() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'intentional demo seed test failure'; END $$",
    );
    await recovery.client.query(
      "CREATE TRIGGER phase4_fail_seed BEFORE INSERT ON system_settings FOR EACH ROW EXECUTE FUNCTION phase4_fail_seed()",
    );
    command("db:seed:demo", recovery.url, 1);
    assert.deepEqual(await snapshot(recovery.client), initial);
    record("late seed failure rolls back every domain row and marker");
    await recovery.client.query(
      "DROP TRIGGER phase4_fail_seed ON system_settings",
    );
    await recovery.client.query("DROP FUNCTION phase4_fail_seed()");
    await recovery.client.query(
      "INSERT INTO categories (name, slug) VALUES ('unrelated probe', 'unrelated-probe')",
    );
    const unrelated = await snapshot(recovery.client);
    command("db:seed:demo", recovery.url, 1);
    assert.deepEqual(await snapshot(recovery.client), unrelated);
    await recovery.client.query(
      "DELETE FROM categories WHERE slug='unrelated-probe'",
    );
    record(
      "unmarked database with unrelated records is refused without changes",
    );
    command("db:seed:demo", recovery.url);
    record("retry after injected failure succeeds with intact guards");
    await recovery.client.query(
      "UPDATE categories SET name='Intentional drift probe' WHERE id=$1",
      [demoId("category/game")],
    );
    const drifted = await snapshot(recovery.client);
    command("db:seed:demo", recovery.url, 1);
    assert.deepEqual(await snapshot(recovery.client), drifted);
    record("fixture drift is rejected without rewriting existing data");
  } finally {
    await recovery.client.end();
  }
  writeFileSync(
    "artifacts/phase4-live.json",
    JSON.stringify({ passed: results.length, databases, results }, null, 2),
  );
  console.info(
    `Phase 4 live validation: ${results.length} checks passed. Disposable databases: ${databases.join(", ")}`,
  );
} catch (error) {
  console.error(
    error instanceof assert.AssertionError
      ? error.message
      : "Phase 4 validation failed. Connection details withheld.",
  );
  process.exitCode = 1;
} finally {
  await admin.end();
}
