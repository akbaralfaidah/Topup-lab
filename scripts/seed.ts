import "dotenv/config";
import { parseEnvironment } from "../src/server/config/schema";
import { createDatabase } from "../src/server/db/connection";
import { foundationMetadata } from "../src/server/db/schema";

const { db, pool } = createDatabase(parseEnvironment(process.env).DATABASE_URL);
try {
  await db
    .insert(foundationMetadata)
    .values({ key: "foundation_version", value: "1" })
    .onConflictDoNothing();
  console.info(
    "Foundation seed applied. No users, credentials, or financial data created.",
  );
} catch {
  console.error("Seed failed. Check connectivity and apply migrations first.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
