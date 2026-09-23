import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { logEvent } from "../logging";

export function createDatabase(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 2000,
    idleTimeoutMillis: 10000,
    statement_timeout: 3000,
  });
  pool.on("error", () => logEvent("error", { event: "database_error" }));
  return { pool, db: drizzle(pool, { schema }) };
}
