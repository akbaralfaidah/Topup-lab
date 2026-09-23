import "dotenv/config";
import { Worker, UnrecoverableError } from "bullmq";
import { parseEnvironment } from "../config/schema";
import { createDatabase } from "../db/connection";
import { foundationMetadata } from "../db/schema";
import { createRedis } from "../redis/connection";
import { logEvent } from "../logging";
import { probeSchema, queueName } from "./queue";

const env = parseEnvironment(process.env);
const { db, pool } = createDatabase(env.DATABASE_URL);
const connection = createRedis(env.REDIS_URL, true);
const worker = new Worker(
  queueName,
  async (job) => {
    const result = probeSchema.safeParse(job.data);
    if (job.name !== "foundation-probe" || !result.success || !job.id) {
      throw new UnrecoverableError("Invalid foundation job");
    }
    try {
      await db
        .insert(foundationMetadata)
        .values({ key: `queue_probe:${job.id}`, value: "completed" })
        .onConflictDoNothing();
      logEvent("info", {
        event: "job_completed",
        jobId: job.id,
        requestId: result.data.requestId,
      });
      return { completed: true };
    } catch {
      throw new Error("Foundation probe could not be persisted");
    }
  },
  { connection, concurrency: 2 },
);

worker.on("ready", () => logEvent("info", { event: "queue_connected" }));
worker.on("error", () => logEvent("error", { event: "queue_error" }));
worker.on("failed", (job) =>
  logEvent("error", { event: "job_failed", jobId: job?.id }),
);

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => process.exit(1), 15000);
  deadline.unref();
  await worker.close();
  connection.disconnect();
  await pool.end();
  clearTimeout(deadline);
  logEvent("info", { event: "worker_stopped" });
}
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    void shutdown();
  });
