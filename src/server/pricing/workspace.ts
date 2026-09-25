import "server-only";
import { sql } from "drizzle-orm";
import { createDatabase } from "@/server/db/connection";
import * as s from "@/server/db/schema";
import { localDemoPricingEnabled } from "./demo-gate";
import {
  calculatePricing,
  classifyCostFreshness,
  PricingConflictError,
  type PricingRule,
} from "./quote-math";

export const demoReferenceTime = new Date("2026-09-24T05:00:00.000Z");

export type WorkspaceData = Awaited<ReturnType<typeof loadWorkspace>>;

export async function loadWorkspace() {
  if (!localDemoPricingEnabled()) throw new Error("Demo workspace unavailable");
  const { db, pool } = createDatabase(process.env.DATABASE_URL!);
  try {
    const [rules, tiers, categories, brands, products, providers, skus] =
      await Promise.all([
        db
          .select({
            id: s.pricingRules.id,
            name: s.pricingRules.name,
            scope: s.pricingRules.scope,
            categoryId: s.pricingRules.categoryId,
            brandId: s.pricingRules.brandId,
            productId: s.pricingRules.productId,
            providerId: s.pricingRules.providerId,
            tierId: s.pricingRules.tierId,
            fixedMarkupIdr: s.pricingRules.fixedMarkupIdr,
            markupBps: s.pricingRules.markupBps,
            minimumMarginIdr: s.pricingRules.minimumMarginIdr,
            active: s.pricingRules.active,
            priority: s.pricingRules.priority,
            startsAt: s.pricingRules.startsAt,
            endsAt: s.pricingRules.endsAt,
            version: sql<string>`${s.pricingRules}.xmin::text`,
          })
          .from(s.pricingRules)
          .limit(201),
        db
          .select({
            id: s.membershipTiers.id,
            code: s.membershipTiers.code,
            name: s.membershipTiers.name,
            active: s.membershipTiers.active,
          })
          .from(s.membershipTiers)
          .limit(20),
        db
          .select({ id: s.categories.id, name: s.categories.name })
          .from(s.categories)
          .limit(100),
        db
          .select({ id: s.brands.id, name: s.brands.name })
          .from(s.brands)
          .limit(100),
        db
          .select({
            id: s.products.id,
            name: s.products.name,
            slug: s.products.slug,
            categoryId: s.products.categoryId,
            brandId: s.products.brandId,
            status: s.products.status,
          })
          .from(s.products)
          .limit(101),
        db
          .select({
            id: s.providers.id,
            name: s.providers.displayName,
            enabled: s.providers.enabled,
            state: s.providers.operationalState,
          })
          .from(s.providers)
          .limit(50),
        db
          .select({
            id: s.providerSkus.id,
            providerId: s.providerSkus.providerId,
            productId: s.providerSkus.productId,
            costIdr: s.providerSkus.costIdr,
            priority: s.providerSkus.priority,
            enabled: s.providerSkus.enabled,
            available: s.providerSkus.available,
            stockState: s.providerSkus.stockState,
            lastSyncedAt: s.providerSkus.lastSyncedAt,
          })
          .from(s.providerSkus)
          .limit(501),
      ]);
    if (rules.length > 200 || products.length > 100 || skus.length > 500)
      throw new Error("Demo workspace query ceiling reached");
    return { rules, tiers, categories, brands, products, providers, skus };
  } finally {
    await pool.end();
  }
}

export function serializeWorkspace(data: WorkspaceData) {
  return {
    ...data,
    rules: data.rules.map((rule) => ({
      ...rule,
      fixedMarkupIdr: rule.fixedMarkupIdr.toString(),
      minimumMarginIdr: rule.minimumMarginIdr.toString(),
      startsAt: rule.startsAt?.toISOString() ?? null,
      endsAt: rule.endsAt?.toISOString() ?? null,
    })),
    skus: data.skus.map((sku) => ({
      ...sku,
      costIdr: sku.costIdr.toString(),
      lastSyncedAt: sku.lastSyncedAt?.toISOString() ?? null,
    })),
  };
}

export type WorkspaceView = ReturnType<typeof serializeWorkspace>;

function candidates(data: WorkspaceData, productId: string) {
  return data.skus
    .filter((sku) => sku.productId === productId)
    .map((sku) => ({
      ...sku,
      provider: data.providers.find((p) => p.id === sku.providerId),
    }))
    .filter((sku) => sku.provider)
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        (a.costIdr < b.costIdr ? -1 : a.costIdr > b.costIdr ? 1 : 0) ||
        a.id.localeCompare(b.id),
    );
}

export function simulate(
  data: WorkspaceData,
  productId: string,
  tierId: string,
  referenceTime: Date = demoReferenceTime,
  replacement?: PricingRule,
) {
  const product = data.products.find((item) => item.id === productId);
  const tier = data.tiers.find((item) => item.id === tierId && item.active);
  if (!product || !tier || !Number.isFinite(referenceTime.getTime()))
    throw new RangeError("Invalid simulation selection");
  const rules: PricingRule[] = replacement
    ? [...data.rules.filter((item) => item.id !== replacement.id), replacement]
    : data.rules;
  const providerRows = candidates(data, productId).map((item) => {
    const eligible =
      !!item.enabled &&
      !!item.available &&
      !!item.provider?.enabled &&
      ["HEALTHY", "DEGRADED"].includes(item.provider.state) &&
      item.stockState !== "OUT_OF_STOCK";
    let result = null;
    let issue: string | null = null;
    if (eligible) {
      try {
        result = calculatePricing(item.costIdr, rules, {
          productId,
          brandId: product.brandId,
          categoryId: product.categoryId,
          providerId: item.providerId,
          tierId,
          referenceTime,
        });
        if (!result) issue = "Tidak ada aturan komersial yang berlaku.";
      } catch (error) {
        issue =
          error instanceof PricingConflictError
            ? "Aturan dengan lingkup, tier, dan prioritas sama bertabrakan."
            : "Konfigurasi harga tidak valid.";
      }
    } else issue = "Kandidat penyedia tidak tersedia.";
    return {
      skuId: item.id,
      providerName: item.provider!.name,
      costIdr: item.costIdr.toString(),
      eligible,
      priority: item.priority,
      freshness: classifyCostFreshness(item.lastSyncedAt, referenceTime),
      issue,
      price: result && {
        sellingPriceIdr: result.sellingPriceIdr.toString(),
        expectedMarginIdr: result.expectedMarginIdr.toString(),
        commercialRuleId: result.commercialRule.id,
        commercialRuleName: result.commercialRule.name ?? "Aturan komersial",
        appliedScope: result.commercialRule.scope,
        providerFloorRuleId: result.providerFloorRule?.id ?? null,
        commercialPercentageIdr: result.commercialPercentageIdr.toString(),
        commercialMarkupIdr: result.commercialMarkupIdr.toString(),
        providerFloorIdr: result.providerFloorIdr?.toString() ?? null,
      },
    };
  });
  return {
    productName: product.name,
    tierName: tier.name,
    referenceTime: referenceTime.toISOString(),
    candidates: providerRows,
    chosen: providerRows.find((row) => row.eligible) ?? null,
  };
}

export function tierComparison(
  data: WorkspaceData,
  productId: string,
  at = demoReferenceTime,
) {
  return data.tiers
    .filter((tier) => tier.active)
    .map((tier) => ({
      tierId: tier.id,
      tierName: tier.name,
      simulation: simulate(data, productId, tier.id, at),
    }));
}

export function workspaceIssues(data: WorkspaceData) {
  const issues: string[] = [];
  const active = data.rules.filter((rule) => rule.active);
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i]!,
        b = active[j]!;
      if (
        a.scope === b.scope &&
        a.categoryId === b.categoryId &&
        a.brandId === b.brandId &&
        a.productId === b.productId &&
        a.providerId === b.providerId &&
        a.tierId === b.tierId &&
        a.priority === b.priority &&
        (a.startsAt?.getTime() ?? -Infinity) <
          (b.endsAt?.getTime() ?? Infinity) &&
        (b.startsAt?.getTime() ?? -Infinity) < (a.endsAt?.getTime() ?? Infinity)
      )
        issues.push(`Aturan ${a.name} dan ${b.name} bertabrakan.`);
    }
  }
  const publicTier = data.tiers.find((tier) => tier.code === "PUBLIC");
  if (publicTier)
    for (const product of data.products.filter(
      (item) => item.status === "ACTIVE",
    )) {
      const result = simulate(data, product.id, publicTier.id);
      if (!result.chosen)
        issues.push(`${product.name}: tidak ada kandidat penyedia tersedia.`);
      else if (!result.chosen.price) {
        const scoped = active.filter(
          (rule) =>
            rule.scope !== "PROVIDER" &&
            (rule.tierId === null || rule.tierId === publicTier.id) &&
            (rule.scope === "GLOBAL" ||
              (rule.scope === "CATEGORY" &&
                rule.categoryId === product.categoryId) ||
              (rule.scope === "BRAND" && rule.brandId === product.brandId) ||
              (rule.scope === "PRODUCT" && rule.productId === product.id)),
        );
        issues.push(
          scoped.length > 0 &&
            scoped.every(
              (rule) => rule.endsAt && rule.endsAt <= demoReferenceTime,
            )
            ? `${product.name}: hanya memiliki aturan yang sudah berakhir.`
            : `${product.name}: harga Public belum dapat dihitung.`,
        );
      }
    }
  return issues.slice(0, 50);
}
