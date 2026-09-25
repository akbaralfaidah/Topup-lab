import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { Client } from "pg";

const config = JSON.parse(
  await readFile("runtime/postgresql17/local.json", "utf8"),
) as { adminUrl: string };
const admin = new URL(config.adminUrl);
if (
  admin.hostname !== "127.0.0.1" ||
  admin.port !== "55417" ||
  admin.pathname !== "/postgres"
)
  throw new Error("Unexpected local PostgreSQL target");
const name = `topuplab_demo_${randomBytes(6).toString("hex")}`;
const client = new Client({ connectionString: config.adminUrl });
await client.connect();
try {
  await client.query(`CREATE DATABASE "${name}"`);
} finally {
  await client.end();
}
const database = new URL(config.adminUrl);
database.pathname = `/${name}`;
const env = {
  ...process.env,
  NODE_ENV: "development" as const,
  APP_MODE: "demo",
  APP_URL: "http://localhost:3200",
  DATABASE_URL: database.toString(),
};
for (const command of [
  "db:migrate",
  "db:seed",
  "db:seed:demo",
  "db:seed:auth",
]) {
  const result = spawnSync("npm.cmd", ["run", command], {
    env,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) throw new Error(`${command} failed`);
}
await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/phase9-db-name.txt", name, "utf8");
console.info(`Disposable Phase 9 database ready: ${name}`);
