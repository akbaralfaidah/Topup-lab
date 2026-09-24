import * as s from "../../../src/server/db/schema";
import { providerMetadataSchema } from "../../../src/server/db/schema/validation";
import { catalog } from "./catalog";
import { demoId, demoTime, timestamps } from "./shared";

export const providers: (typeof s.providers.$inferInsert)[] = [
  {
    id: demoId("provider/alpha"),
    code: "DEMO_ALPHA",
    displayName: "Alpha Digital (Demo)",
    enabled: true,
    operationalState: "HEALTHY",
    configReference: null,
    ...timestamps,
  },
  {
    id: demoId("provider/beta"),
    code: "DEMO_BETA",
    displayName: "Beta Supply (Demo)",
    enabled: true,
    operationalState: "DEGRADED",
    configReference: null,
    ...timestamps,
  },
  {
    id: demoId("provider/gamma"),
    code: "DEMO_GAMMA",
    displayName: "Gamma H2H (Demo)",
    enabled: false,
    operationalState: "PAUSED",
    configReference: null,
    ...timestamps,
  },
];
export const providerSkus: (typeof s.providerSkus.$inferInsert)[] =
  catalog.flatMap((product, index) =>
    ["alpha", "beta", "gamma"]
      .slice(0, 1 + (index % 3))
      .map((provider, priority) => ({
        id: demoId(`sku/${provider}/${product.key}`),
        providerId: demoId(`provider/${provider}`),
        productId: product.row.id,
        externalSku: `DEMO_${provider.toUpperCase()}_${product.key.toUpperCase().replaceAll("-", "_")}`,
        costIdr: product.costIdr + [0n, 200n, 500n][priority]!,
        priority: 10 + priority * 10,
        enabled: provider !== "gamma",
        available: provider !== "gamma" && index % 7 !== 0,
        stockState:
          provider === "gamma"
            ? "UNKNOWN"
            : index % 7 === 0
              ? "OUT_OF_STOCK"
              : index % 5 === 0
                ? "LIMITED"
                : "AVAILABLE",
        stockQuantity:
          provider === "gamma"
            ? null
            : index % 7 === 0
              ? 0
              : index % 5 === 0
                ? 4
                : 50,
        lastSyncedAt: null,
        metadata: providerMetadataSchema.parse({
          catalogVersion: "DEMO_V1",
          regionCode: "ID",
        }),
        ...timestamps,
      })),
  );
export const providerHealth: (typeof s.providerHealth.$inferInsert)[] = [
  {
    key: "alpha",
    state: "HEALTHY",
    latencyMs: 180,
    successRateBps: 9850,
    pendingRateBps: 100,
    timeoutRateBps: 50,
    hours: 0,
  },
  {
    key: "beta",
    state: "DEGRADED",
    latencyMs: 1800,
    successRateBps: 8500,
    pendingRateBps: 1000,
    timeoutRateBps: 500,
    hours: 0,
  },
  {
    key: "gamma",
    state: "OFFLINE",
    latencyMs: null,
    successRateBps: 0,
    pendingRateBps: 0,
    timeoutRateBps: 10000,
    hours: 2,
  },
  {
    key: "gamma",
    state: "PAUSED",
    latencyMs: null,
    successRateBps: null,
    pendingRateBps: null,
    timeoutRateBps: null,
    hours: 0,
  },
].map((observation) => ({
  id: demoId(`health/${observation.key}/${observation.state}`),
  providerId: demoId(`provider/${observation.key}`),
  state: observation.state as typeof s.providerHealth.$inferInsert.state,
  latencyMs: observation.latencyMs,
  successRateBps: observation.successRateBps,
  pendingRateBps: observation.pendingRateBps,
  timeoutRateBps: observation.timeoutRateBps,
  balanceIdr: null,
  lastSuccessAt:
    observation.key === "gamma" ? null : new Date("2026-09-24T04:55:00Z"),
  lastFailureAt:
    observation.key === "alpha" ? null : new Date("2026-09-24T02:50:00Z"),
  checkedAt: new Date(demoTime.getTime() - observation.hours * 3600000),
  createdAt: demoTime,
}));
