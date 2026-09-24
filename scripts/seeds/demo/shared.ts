import { createHash } from "node:crypto";

export const demoTime = new Date("2026-09-24T05:00:00.000Z");
export const timestamps = { createdAt: demoTime, updatedAt: demoTime };
export const demoVersion = "topuplab-demo-v1";

// Stable fixture UUIDs are namespaced hashes, never customer-facing secrets.
export function demoId(key: string): string {
  const bytes = createHash("sha256").update(`${demoVersion}/${key}`).digest();
  bytes[6] = (bytes[6]! & 15) | 128;
  bytes[8] = (bytes[8]! & 63) | 128;
  const hex = bytes.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function canonical(value: unknown): string {
  if (typeof value === "bigint") return JSON.stringify(value.toString());
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export const schedules = {
  active: {
    startsAt: new Date("2026-09-01T00:00:00+07:00"),
    endsAt: new Date("2026-10-01T00:00:00+07:00"),
  },
  upcoming: {
    startsAt: new Date("2026-10-01T00:00:00+07:00"),
    endsAt: new Date("2026-11-01T00:00:00+07:00"),
  },
  expired: {
    startsAt: new Date("2026-08-01T00:00:00+07:00"),
    endsAt: new Date("2026-09-01T00:00:00+07:00"),
  },
};
