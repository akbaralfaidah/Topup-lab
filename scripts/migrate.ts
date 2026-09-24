import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { parseEnvironment } from "../src/server/config/schema";
import { createDatabase } from "../src/server/db/connection";

const { db, pool } = createDatabase(parseEnvironment(process.env).DATABASE_URL);
try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.info("Database migrations applied.");
} catch {
  console.error(
    "Migration failed. Check database connectivity and migration permissions.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
