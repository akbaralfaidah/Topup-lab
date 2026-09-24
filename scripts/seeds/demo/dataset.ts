import { createHash } from "node:crypto";
import { getTableName, type InferInsertModel } from "drizzle-orm";
import { type PgTable } from "drizzle-orm/pg-core";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as s from "../../../src/server/db/schema";
import * as catalog from "./catalog";
import * as providers from "./providers";
import * as membership from "./membership";
import * as promotions from "./promotions";
import * as operations from "./operations";
import { canonical, demoVersion } from "./shared";

type Transaction = Parameters<
  Parameters<NodePgDatabase<typeof s>["transaction"]>[0]
>[0];
function batch<T extends PgTable>(table: T, rows: InferInsertModel<T>[]) {
  return {
    name: getTableName(table),
    rows,
    insert: async (tx: Transaction) => {
      await tx.insert(table).values(rows).onConflictDoNothing();
    },
  };
}
export const batches = [
  batch(s.categories, catalog.categories),
  batch(s.brands, catalog.brands),
  batch(s.productInputSchemas, catalog.inputSchemas),
  batch(s.products, catalog.products),
  batch(s.providers, providers.providers),
  batch(s.providerSkus, providers.providerSkus),
  batch(s.providerHealth, providers.providerHealth),
  batch(s.membershipTiers, membership.membershipTiers),
  batch(s.roles, membership.roles),
  batch(s.users, membership.users),
  batch(s.customerProfiles, membership.profiles),
  batch(s.userRoles, membership.userRoles),
  batch(s.membershipHistory, membership.membershipHistory),
  batch(s.pricingRules, membership.pricingRules),
  batch(s.promos, promotions.promos),
  batch(s.promoProducts, promotions.promoProducts),
  batch(s.promoCategories, promotions.promoCategories),
  batch(s.promoTiers, promotions.promoTiers),
  batch(s.flashSales, promotions.flashSales),
  batch(s.flashSaleItems, promotions.flashSaleItems),
  batch(s.cmsBanners, operations.banners),
  batch(s.systemSettings, operations.settings),
];
export const fixtureHash = createHash("sha256")
  .update(
    canonical({
      version: demoVersion,
      data: batches.map(({ name, rows }) => ({ name, rows })),
    }),
  )
  .digest("hex");
