import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { Client } from "pg";
import { validateDomain } from "../tests/integration/phase3";

const config = JSON.parse(
  readFileSync("runtime/postgresql17/local.json", "utf8"),
) as { adminUrl: string };
const adminUrl = new URL(config.adminUrl);
assert.equal(adminUrl.hostname, "127.0.0.1");
assert.equal(adminUrl.port, "55417");
assert.equal(adminUrl.pathname, "/postgres");
assert.equal(adminUrl.username, "topuplab_local");
const npm = process.env.npm_execpath;
assert.ok(npm, "Run through npm run db:validate:live");
const admin = new Client({
  connectionString: adminUrl.href,
  connectionTimeoutMillis: 3000,
});
const results: { name: string; passed: boolean }[] = [];
const databases: string[] = [];
const expectedJournal = JSON.parse(
  readFileSync("drizzle/meta/_journal.json", "utf8"),
) as { entries: { tag: string; when: number }[] };
const record = (name: string) => {
  results.push({ name, passed: true });
  console.info(`PASS ${name}`);
};
function command(task: "db:migrate" | "db:seed", url: URL, expected = 0) {
  assert.match(url.pathname, /^\/topuplab_phase3_[a-f0-9]{12}(?:_recovery)?$/);
  const result = spawnSync(process.execPath, [npm!, "run", task], {
    env: {
      ...process.env,
      NODE_ENV: "test",
      APP_MODE: "demo",
      APP_URL: "http://127.0.0.1:3000",
      DATABASE_URL: url.href,
      REDIS_URL: "redis://127.0.0.1:6379",
    },
    encoding: "utf8",
    timeout: 60000,
    windowsHide: true,
  });
  if (result.status !== expected)
    throw new Error(
      `${task} returned ${result.status}; expected ${expected}. ${result.stdout.replaceAll(url.href, "[local database]")} ${result.stderr.replaceAll(url.href, "[local database]")}`,
    );
}
async function createDatabase(name: string) {
  assert.match(name, /^topuplab_phase3_[a-f0-9]{12}(?:_recovery)?$/);
  await admin.query(`CREATE DATABASE "${name}"`);
  databases.push(name);
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  return url;
}
async function connect(url: URL) {
  const client = new Client({
    connectionString: url.href,
    connectionTimeoutMillis: 3000,
  });
  await client.connect();
  return client;
}

try {
  await admin.connect();
  const version = (await admin.query("SHOW server_version_num")).rows[0]
    .server_version_num as string;
  assert.ok(Number(version) >= 170000 && Number(version) < 180000);
  assert.equal(
    (await admin.query("SHOW listen_addresses")).rows[0].listen_addresses,
    "127.0.0.1",
  );
  record(`PostgreSQL 17 (${version}), loopback-only`);
  const name = `topuplab_phase3_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const url = await createDatabase(name);
  command("db:migrate", url);
  const client = await connect(url);
  try {
    const journal = (
      await client.query(
        "SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at",
      )
    ).rows;
    assert.equal(journal.length, expectedJournal.entries.length);
    assert.deepEqual(
      journal,
      expectedJournal.entries.map((entry) => ({
        hash: createHash("sha256")
          .update(readFileSync(`drizzle/${entry.tag}.sql`))
          .digest("hex"),
        created_at: String(entry.when),
      })),
    );
    record(
      "clean migration: every journaled migration applied in order with matching hashes",
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
    record("repeat migration preserves every journal row");
    command("db:seed", url);
    const seed = (
      await client.query("SELECT * FROM foundation_metadata ORDER BY key")
    ).rows;
    assert.equal(seed.length, 1);
    assert.equal(seed[0].key, "foundation_version");
    assert.equal(seed[0].value, "1");
    command("db:seed", url);
    assert.deepEqual(
      (await client.query("SELECT * FROM foundation_metadata ORDER BY key"))
        .rows,
      seed,
    );
    record("technical seed twice preserves one identical version marker");
    await validateDomain(client, record);
  } finally {
    await client.end();
  }

  // A deliberate collision tests Drizzle's existing transaction, not a down migration.
  const recoveryUrl = await createDatabase(`${name}_recovery`);
  const recovery = await connect(recoveryUrl);
  try {
    await recovery.query("CREATE TABLE public.users (probe boolean)");
    command("db:migrate", recoveryUrl, 1);
    assert.equal(
      (
        await recovery.query(
          "SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations",
        )
      ).rows[0].count,
      0,
    );
    assert.deepEqual(
      (
        await recovery.query(
          "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
        )
      ).rows,
      [{ tablename: "users" }],
    );
    assert.equal(
      (
        await recovery.query(
          "SELECT count(*)::int AS count FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typtype='e'",
        )
      ).rows[0].count,
      0,
    );
    record("failed migration rolls back pending DDL and journal entries");
    await recovery.query("DROP TABLE public.users");
    command("db:migrate", recoveryUrl);
    assert.equal(
      (
        await recovery.query(
          "SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations",
        )
      ).rows[0].count,
      expectedJournal.entries.length,
    );
    command("db:migrate", recoveryUrl);
    record(
      "recovery after removing only the test collision succeeds and repeats safely",
    );
  } finally {
    await recovery.end();
  }
} catch (error) {
  results.push({
    name: error instanceof Error ? error.message : "Unknown validation failure",
    passed: false,
  });
  console.error(results.at(-1)?.name);
  process.exitCode = 1;
} finally {
  await admin.end();
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/phase3-live.json",
    JSON.stringify(
      { date: new Date().toISOString(), databases, results },
      null,
      2,
    ),
  );
  console.info(
    `${results.filter((result) => result.passed).length} checks passed; ${results.filter((result) => !result.passed).length} failed. Report: artifacts/phase3-live.json`,
  );
}
