import "server-only";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { createDatabase } from "@/server/db/connection";
import * as s from "@/server/db/schema";
import {
  inputDefinitionSchema,
  type InputDefinition,
} from "@/server/db/schema/validation";
import { localDemoCatalogEnabled } from "@/server/catalog-runtime";
import {
  addPaymentFee,
  calculatePricing,
  type PricingRule,
} from "./quote-math";

export type DemoPayment = "QRIS" | "VA" | "EWALLET";
const paymentFees: Record<DemoPayment, bigint> = {
  QRIS: 0n,
  VA: 2500n,
  EWALLET: 1500n,
};
const referenceTime = new Date("2026-09-24T05:00:00.000Z");

import { signQuote } from "../checkout/quote-token";

export type PublicQuote = {
  productSlug: string;
  productName: string;
  denomination: string;
  available: boolean;
  priceIdr: string | null;
  feeIdr: string | null;
  totalIdr: string | null;
  payment: DemoPayment;
  quoteToken?: string;
};
export type PreparedProduct = {
  quote: PublicQuote;
  inputDefinition: InputDefinition;
};
export type PreviewResult =
  | { state: "ready"; products: PreparedProduct[] }
  | { state: "unavailable" | "invalid" | "pricing_error"; products: [] };

export async function readDemoPreviews(
  slugs: string[],
  payment: DemoPayment,
): Promise<PreviewResult> {
  if (!localDemoCatalogEnabled()) return { state: "unavailable", products: [] };
  if (
    !slugs.length ||
    slugs.length > 12 ||
    slugs.some((slug) => !/^[a-z0-9-]{1,80}$/.test(slug))
  )
    return { state: "invalid", products: [] };
  const { db, pool } = createDatabase(process.env.DATABASE_URL!);
  try {
    const [products, tiers] = await Promise.all([
      db
        .select({
          id: s.products.id,
          slug: s.products.slug,
          name: s.products.name,
          categoryId: s.products.categoryId,
          brandId: s.products.brandId,
          brandName: s.brands.name,
          definition: s.productInputSchemas.definition,
        })
        .from(s.products)
        .innerJoin(s.categories, eq(s.products.categoryId, s.categories.id))
        .innerJoin(
          s.productInputSchemas,
          eq(s.products.inputSchemaId, s.productInputSchemas.id),
        )
        .leftJoin(s.brands, eq(s.products.brandId, s.brands.id))
        .where(
          and(
            inArray(s.products.slug, slugs),
            eq(s.products.status, "ACTIVE"),
            eq(s.categories.status, "ACTIVE"),
            or(isNull(s.brands.id), eq(s.brands.status, "ACTIVE")),
          ),
        )
        .limit(12),
      db
        .select({ id: s.membershipTiers.id })
        .from(s.membershipTiers)
        .where(
          and(
            eq(s.membershipTiers.code, "PUBLIC"),
            eq(s.membershipTiers.active, true),
          ),
        )
        .limit(1),
    ]);
    if (products.length !== slugs.length)
      return { state: "invalid", products: [] };
    const tierId = tiers[0]?.id;
    if (!tierId) return { state: "pricing_error", products: [] };
    const [candidates, rules] = await Promise.all([
      db
        .select({
          id: s.providerSkus.id,
          providerId: s.providerSkus.providerId,
          productId: s.providerSkus.productId,
          costIdr: s.providerSkus.costIdr,
          priority: s.providerSkus.priority,
        })
        .from(s.providerSkus)
        .innerJoin(s.providers, eq(s.providerSkus.providerId, s.providers.id))
        .where(
          and(
            inArray(
              s.providerSkus.productId,
              products.map((product) => product.id),
            ),
            eq(s.providerSkus.enabled, true),
            eq(s.providerSkus.available, true),
            eq(s.providers.enabled, true),
            inArray(s.providers.operationalState, ["HEALTHY", "DEGRADED"]),
            inArray(s.providerSkus.stockState, [
              "AVAILABLE",
              "LIMITED",
              "UNKNOWN",
            ]),
          ),
        )
        .limit(100),
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
        })
        .from(s.pricingRules)
        .where(eq(s.pricingRules.active, true))
        .limit(200),
    ]);
    if (candidates.length >= 100 || rules.length >= 200)
      return { state: "pricing_error", products: [] };
    const prepared: PreparedProduct[] = [];
    for (const product of products) {
      const parsed = inputDefinitionSchema.safeParse(product.definition);
      if (!parsed.success) return { state: "pricing_error", products: [] };
      const choice = candidates
        .filter((candidate) => candidate.productId === product.id)
        .sort(
          (a, b) =>
            a.priority - b.priority ||
            (a.costIdr < b.costIdr ? -1 : a.costIdr > b.costIdr ? 1 : 0) ||
            a.id.localeCompare(b.id),
        )[0];
      const denomination =
        product.brandName && product.name.startsWith(`${product.brandName} `)
          ? product.name.slice(product.brandName.length + 1)
          : product.name;
      let priceIdr: string | null = null;
      let feeIdr: string | null = null;
      let totalIdr: string | null = null;
      if (choice) {
        const result = calculatePricing(
          choice.costIdr,
          rules as PricingRule[],
          {
            productId: product.id,
            brandId: product.brandId,
            categoryId: product.categoryId,
            providerId: choice.providerId,
            tierId,
            referenceTime,
          },
        );
        if (!result) return { state: "pricing_error", products: [] };
        const price = result.sellingPriceIdr;
        const fee = paymentFees[payment];
        priceIdr = price.toString();
        feeIdr = fee.toString();
        totalIdr = addPaymentFee(price, fee).toString();
      }
      let quoteToken: string | undefined;
      if (totalIdr) {
        quoteToken = signQuote({
          productSlug: product.slug,
          payment,
          totalIdr,
        }).token;
      }
      prepared.push({
        quote: {
          productSlug: product.slug,
          productName: product.name,
          denomination,
          available: !!choice,
          priceIdr,
          feeIdr,
          totalIdr,
          payment,
          quoteToken,
        },
        inputDefinition: parsed.data,
      });
    }
    return {
      state: "ready",
      products: slugs.map((slug) =>
        prepared.find((item) => item.quote.productSlug === slug)!,
      ),
    };
  } catch {
    return { state: "unavailable", products: [] };
  } finally {
    await pool.end();
  }
}
