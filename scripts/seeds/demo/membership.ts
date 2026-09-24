import * as s from "../../../src/server/db/schema";
import { tierBenefitsSchema } from "../../../src/server/db/schema/validation";
import { demoId, demoTime, timestamps } from "./shared";

export const membershipTiers: (typeof s.membershipTiers.$inferInsert)[] = [
  "Public",
  "Member",
  "Gold",
  "Reseller",
].map((name, level) => ({
  id: demoId(`tier/${name.toLowerCase()}`),
  code: name.toUpperCase(),
  name,
  level,
  active: true,
  benefits: tierBenefitsSchema.parse({
    descriptions: [
      `Contoh tingkat ${name} untuk perbandingan harga demo.`,
      "Manfaat belum berlaku untuk transaksi.",
    ],
  }),
  ...timestamps,
}));
export const roles: (typeof s.roles.$inferInsert)[] = [
  "customer",
  "reseller",
].map((role) => ({
  id: demoId(`role/${role}`),
  code: `DEMO_${role.toUpperCase()}`,
  name: `${role === "customer" ? "Pelanggan" : "Reseller"} Demo`,
  active: true,
  ...timestamps,
}));
const people = ["member", "gold", "reseller"];
export const users: (typeof s.users.$inferInsert)[] = people.map((tier) => ({
  id: demoId(`user/${tier}`),
  emailNormalized: `demo.${tier}@example.invalid`,
  status: "ACTIVE",
  ...timestamps,
}));
export const profiles: (typeof s.customerProfiles.$inferInsert)[] = people.map(
  (tier) => ({
    id: demoId(`profile/${tier}`),
    userId: demoId(`user/${tier}`),
    displayName: `Pengguna Demo ${tier}`,
    membershipTierId: demoId(`tier/${tier}`),
    membershipExpiresAt: null,
    ...timestamps,
  }),
);
export const userRoles: (typeof s.userRoles.$inferInsert)[] = people.map(
  (tier) => ({
    userId: demoId(`user/${tier}`),
    roleId: demoId(`role/${tier === "reseller" ? "reseller" : "customer"}`),
    createdAt: demoTime,
  }),
);
export const membershipHistory: (typeof s.membershipHistory.$inferInsert)[] =
  people.map((tier) => ({
    id: demoId(`membership/${tier}`),
    userId: demoId(`user/${tier}`),
    previousTierId: null,
    newTierId: demoId(`tier/${tier}`),
    reasonCode: "DEMO_INITIAL_ASSIGNMENT",
    origin: "SYSTEM",
    effectiveAt: demoTime,
    idempotencyKey: `demo:v1:membership:${tier}`,
    createdAt: demoTime,
  }));
export const pricingRules: (typeof s.pricingRules.$inferInsert)[] = [
  ...["public", "member", "gold", "reseller"].map((tier, index) => ({
    id: demoId(`pricing/${tier}`),
    name: `Demo: markup ${tier}`,
    scope: "GLOBAL" as const,
    tierId: demoId(`tier/${tier}`),
    fixedMarkupIdr: [1500n, 1200n, 900n, 600n][index],
    markupBps: [300, 250, 200, 150][index],
    minimumMarginIdr: 500n,
    active: true,
    priority: 100,
    ...timestamps,
  })),
  {
    id: demoId("pricing/game"),
    name: "Demo: kategori game",
    scope: "CATEGORY",
    categoryId: demoId("category/game"),
    tierId: demoId("tier/public"),
    fixedMarkupIdr: 1000n,
    markupBps: 250,
    minimumMarginIdr: 500n,
    active: true,
    priority: 50,
    ...timestamps,
  },
  {
    id: demoId("pricing/ml86"),
    name: "Demo: khusus Mobile Legends 86",
    scope: "PRODUCT",
    productId: demoId("product/mobile-legends-86"),
    tierId: demoId("tier/public"),
    fixedMarkupIdr: 900n,
    markupBps: 200,
    minimumMarginIdr: 500n,
    active: true,
    priority: 10,
    ...timestamps,
  },
];
