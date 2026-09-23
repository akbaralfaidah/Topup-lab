import { Redis } from "ioredis";
import { logEvent } from "../logging";

export function createRedis(url: string, worker = false) {
  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: worker ? null : 1,
    connectTimeout: 2000,
    ...(worker ? {} : { commandTimeout: 3000 }),
    retryStrategy: worker ? (times) => Math.min(times * 500, 5000) : () => null,
    enableOfflineQueue: worker,
  });
  client.on("error", () => logEvent("error", { event: "queue_error" }));
  return client;
}
