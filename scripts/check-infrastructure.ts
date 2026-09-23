import "dotenv/config";
import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { eq } from "drizzle-orm";
import { parseEnvironment } from "../src/server/config/schema";
import { createDatabase } from "../src/server/db/connection";
import { foundationMetadata } from "../src/server/db/schema";
import { createProbeQueue } from "../src/server/jobs/queue";

const env = parseEnvironment(process.env);
const { db, pool } = createDatabase(env.DATABASE_URL);
let queueResources: Awaited<ReturnType<typeof createProbeQueue>> | undefined;
try {
  await pool.query("SELECT 1");
  queueResources = await createProbeQueue(env.REDIS_URL);
  const id = randomUUID();
  const job = await queueResources.queue.add(
    "foundation-probe",
    { requestId: id },
    { jobId: id },
  );
  const deadline = Date.now() + 10000;
  while ((await job.getState()) !== "completed") {
    if (Date.now() >= deadline) throw new Error("Worker probe timed out");
    await setTimeout(250);
  }
  const [row] = await db
    .select()
    .from(foundationMetadata)
    .where(eq(foundationMetadata.key, `queue_probe:${id}`));
  if (row?.value !== "completed") throw new Error("Probe not persisted");
  console.info("PostgreSQL, Redis, and worker probe passed.");
} catch {
  console.error(
    "Infrastructure check failed. Start PostgreSQL, Redis, and the worker; apply migrations first.",
  );
  process.exitCode = 1;
} finally {
  await queueResources?.queue.close();
  queueResources?.connection.disconnect();
  await pool.end();
}
