import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { getTableName, is, sql } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { createDatabase } from "../../../src/server/db/connection";
import * as schema from "../../../src/server/db/schema";
import { batches, fixtureHash } from "./dataset";
import { guardDemoEnvironment, DemoSeedError } from "./guard";
import { demoTime, demoVersion } from "./shared";

export async function seedDemo(env: NodeJS.ProcessEnv) {
  const url = guardDemoEnvironment(env);
  const { db, pool } = createDatabase(url.href);
  try {
    return await db.transaction(async (tx) => {
      const identity = await tx.execute<{
        name: string;
        address: string;
        port: number;
        version: string;
      }>(
        sql`SELECT current_database() AS name, host(inet_server_addr()) AS address, inet_server_port() AS port, current_setting('server_version_num') AS version`,
      );
      const actual = identity.rows[0];
      if (
        !actual ||
        actual.name !== url.pathname.slice(1) ||
        actual.address !== "127.0.0.1" ||
        actual.port !== 55417 ||
        Number(actual.version) < 170000 ||
        Number(actual.version) >= 180000
      )
        throw new DemoSeedError(
          "Connected database does not match the approved local PostgreSQL 17 target.",
        );
      await tx.execute(sql`SELECT pg_advisory_xact_lock(70404)`);
      await tx.execute(sql`SET LOCAL TIME ZONE 'UTC'`);
      await tx.execute(sql`SET LOCAL search_path = public`);
      const expectedJournal = JSON.parse(
        readFileSync("drizzle/meta/_journal.json", "utf8"),
      ) as { entries: { tag: string; when: number }[] };
      const applied = await tx.execute<{ hash: string; created_at: string }>(
        sql`SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`,
      );
      if (
        applied.rows.length !== expectedJournal.entries.length ||
        expectedJournal.entries.some(
          (entry, index) =>
            applied.rows[index]?.hash !==
              createHash("sha256")
                .update(readFileSync(`drizzle/${entry.tag}.sql`))
                .digest("hex") ||
            applied.rows[index]?.created_at !== String(entry.when),
        )
      ) {
        throw new DemoSeedError(
          "Apply the complete existing migration chain before seeding demo data.",
        );
      }
      const tables = Object.values(schema)
        .filter((value) => is(value, PgTable))
        .filter((table) => getTableName(table) !== "foundation_metadata")
        .sort((a, b) => getTableName(a).localeCompare(getTableName(b)));
      // Lock all domain tables so an unrelated writer cannot race the empty-database check.
      await tx.execute(
        sql`LOCK TABLE ${sql.join(
          tables.map((table) => sql`${table}`),
          sql`, `,
        )} IN SHARE ROW EXCLUSIVE MODE`,
      );
      const metadata = await tx.select().from(schema.foundationMetadata);
      if (
        !metadata.some(
          (row) => row.key === "foundation_version" && row.value === "1",
        )
      )
        throw new DemoSeedError("Run the technical seed before the demo seed.");
      const marker = metadata.find((row) => row.key === demoVersion);
      if (
        metadata.some(
          (row) => !["foundation_version", demoVersion].includes(row.key),
        )
      )
        throw new DemoSeedError(
          "Unknown foundation metadata: use a fresh disposable database.",
        );
      async function snapshot() {
        const counts: Record<string, number> = {};
        const hash = createHash("sha256");
        for (const table of tables) {
          const name = getTableName(table);
          const data = await tx.execute<{ row: string }>(
            sql`SELECT row_to_json(t)::text AS row FROM ${table} AS t ORDER BY row_to_json(t)::text`,
          );
          counts[name] = data.rows.length;
          hash.update(JSON.stringify({ name, rows: data.rows }));
        }
        return { counts, hash: hash.digest("hex") };
      }
      const before = await snapshot();
      if (marker) {
        if (marker.value !== `${fixtureHash}:${before.hash}`)
          throw new DemoSeedError(
            "Demo fixtures changed or database drift was detected. Create a fresh disposable database; history will not be rewritten.",
          );
        return {
          action: "verified",
          counts: before.counts,
          fixtureHash,
          snapshotHash: before.hash,
        };
      }
      if (Object.values(before.counts).some((count) => count !== 0))
        throw new DemoSeedError(
          "Demo seed refuses a database containing domain records without its fixture marker.",
        );
      for (const batch of batches) await batch.insert(tx);
      const after = await snapshot();
      for (const table of tables) {
        const name = getTableName(table);
        const expected =
          batches.find((batch) => batch.name === name)?.rows.length ?? 0;
        if (after.counts[name] !== expected)
          throw new DemoSeedError(`Unexpected demo row count in ${name}.`);
      }
      await tx.insert(schema.foundationMetadata).values({
        key: demoVersion,
        value: `${fixtureHash}:${after.hash}`,
        createdAt: demoTime,
        updatedAt: demoTime,
      });
      return {
        action: "inserted",
        counts: after.counts,
        fixtureHash,
        snapshotHash: after.hash,
      };
    });
  } finally {
    await pool.end();
  }
}
