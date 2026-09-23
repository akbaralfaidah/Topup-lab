import { Queue } from "bullmq";
import { z } from "zod";
import { createRedis } from "../redis/connection";

export const queueName = "topuplab-foundation";
export const probeSchema = z.object({ requestId: z.uuid() }).strict();
export type ProbeJob = z.infer<typeof probeSchema>;

export async function createProbeQueue(url: string) {
  const connection = createRedis(url);
  await connection.connect();
  const queue = new Queue<ProbeJob>(queueName, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { age: 86400, count: 100 },
      removeOnFail: { age: 604800, count: 1000 },
    },
  });
  return { queue, connection };
}
