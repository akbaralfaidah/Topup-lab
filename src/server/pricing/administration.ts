import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { createDatabase } from "@/server/db/connection";
import * as s from "@/server/db/schema";
import { localDemoPricingEnabled } from "./demo-gate";
import { getEnvironment } from "@/server/config/env";
import { type PricingRule } from "./quote-math";
import {
  parseRuleInput,
  targetColumns,
  windowsOverlap,
  type ParsedRuleInput,
} from "./rule-input";
import {
  demoReferenceTime,
  loadWorkspace,
  simulate,
  tierComparison,
  type WorkspaceData,
} from "./workspace";

export class RuleAdminError extends Error {
  constructor(public code: "invalid" | "conflict" | "stale" | "unavailable") {
    super(code);
  }
}

export type PricingContext = { mode: "demo" | "admin"; actorId?: string };
const demoContext: PricingContext = { mode: "demo" };

function checkContext(context: PricingContext) {
  if (context.mode === "demo" && !localDemoPricingEnabled())
    throw new RuleAdminError("unavailable");
  if (context.mode === "admin" && !context.actorId)
    throw new RuleAdminError("unavailable");
}

function parsedRule(input: ParsedRuleInput): PricingRule {
  return {
    id: input.id ?? crypto.randomUUID(),
    name: input.name,
    scope: input.scope,
    ...targetColumns(input.scope, input.targetId),
    tierId: input.tierId,
    fixedMarkupIdr: input.fixedMarkupIdr,
    markupBps: input.markupBps,
    minimumMarginIdr: input.minimumMarginIdr,
    active: input.active,
    priority: input.priority,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
  };
}

function checkRule(input: ParsedRuleInput, data: WorkspaceData): PricingRule {
  const targetSets = {
    CATEGORY: data.categories,
    BRAND: data.brands,
    PRODUCT: data.products,
    PROVIDER: data.providers,
  };
  if (
    (input.tierId &&
      !data.tiers.some((tier) => tier.id === input.tierId && tier.active)) ||
    (input.scope !== "GLOBAL" &&
      !targetSets[input.scope].some((item) => item.id === input.targetId))
  )
    throw new RuleAdminError("invalid");
  const draft = parsedRule(input);
  if (draft.active) {
    for (const other of data.rules) {
      if (other.id === draft.id || !other.active) continue;
      if (
        other.scope === draft.scope &&
        other.categoryId === draft.categoryId &&
        other.brandId === draft.brandId &&
        other.productId === draft.productId &&
        other.providerId === draft.providerId &&
        other.tierId === draft.tierId &&
        other.priority === draft.priority &&
        windowsOverlap(other, draft)
      )
        throw new RuleAdminError("conflict");
    }
  }
  return draft;
}

function affectedProducts(data: WorkspaceData, rule: PricingRule) {
  return data.products.filter(
    (product) =>
      rule.scope === "GLOBAL" ||
      rule.scope === "PROVIDER" ||
      (rule.scope === "PRODUCT" && product.id === rule.productId) ||
      (rule.scope === "CATEGORY" && product.categoryId === rule.categoryId) ||
      (rule.scope === "BRAND" && product.brandId === rule.brandId),
  );
}

export async function previewRuleChange(
  raw: unknown,
  selectedProductId?: string,
  context: PricingContext = demoContext,
) {
  checkContext(context);
  let input: ParsedRuleInput;
  try {
    input = parseRuleInput(raw);
  } catch {
    throw new RuleAdminError("invalid");
  }
  const data = await loadWorkspace(context.mode);
  const draft = checkRule(input, data);
  const previous = input.id
    ? data.rules.find((rule) => rule.id === input.id)
    : null;
  const tier =
    data.tiers.find((item) => item.id === input.tierId) ??
    data.tiers.find((item) => item.code === "PUBLIC");
  const affectedIds = new Set([
    ...affectedProducts(data, draft).map((item) => item.id),
    ...(previous
      ? affectedProducts(data, previous).map((item) => item.id)
      : []),
  ]);
  const affected = data.products.filter((item) => affectedIds.has(item.id));
  const priced = tier
    ? affected.filter((item) => simulate(data, item.id, tier.id).chosen?.price)
    : [];
  const product =
    priced.find((item) => item.id === selectedProductId) ??
    priced[0] ??
    affected.find((item) => item.id === selectedProductId) ??
    affected[0];
  if (!product || !tier)
    return {
      affectedCount: affected.length,
      productName: null,
      before: null,
      after: null,
      tierImpact: [],
    };
  const before = simulate(data, product.id, tier.id, demoReferenceTime);
  const after = simulate(data, product.id, tier.id, demoReferenceTime, draft);
  const tierImpact = data.tiers
    .filter((item) => item.active)
    .map((item) => ({
      tierName: item.name,
      before:
        simulate(data, product.id, item.id).chosen?.price?.sellingPriceIdr ??
        null,
      after:
        simulate(data, product.id, item.id, demoReferenceTime, draft).chosen
          ?.price?.sellingPriceIdr ?? null,
    }));
  return {
    affectedCount: affected.length,
    productName: product.name,
    before: before.chosen,
    after: after.chosen,
    tierImpact,
  };
}

export async function saveRule(
  raw: unknown,
  context: PricingContext = demoContext,
) {
  checkContext(context);
  let input: ParsedRuleInput;
  try {
    input = parseRuleInput(raw);
  } catch {
    throw new RuleAdminError("invalid");
  }
  const data = await loadWorkspace(context.mode);
  checkRule(input, data);
  const { db, pool } = createDatabase(getEnvironment().DATABASE_URL);
  try {
    return await db.transaction(
      async (tx) => {
        const current = await tx
          .select({
            id: s.pricingRules.id,
            version: sql<string>`${s.pricingRules}.xmin::text`,
          })
          .from(s.pricingRules)
          .limit(201);
        if (current.length > 200) throw new RuleAdminError("unavailable");
        if (
          input.id &&
          !current.some(
            (rule) => rule.id === input.id && rule.version === input.version,
          )
        )
          throw new RuleAdminError("stale");
        const all = await tx.select().from(s.pricingRules).limit(201);
        if (all.length > 200) throw new RuleAdminError("unavailable");
        checkRule(input, {
          ...data,
          rules: all.map((rule) => ({ ...rule, version: "" })),
        });
        const values = {
          name: input.name,
          scope: input.scope,
          ...targetColumns(input.scope, input.targetId),
          tierId: input.tierId,
          fixedMarkupIdr: input.fixedMarkupIdr,
          markupBps: input.markupBps,
          minimumMarginIdr: input.minimumMarginIdr,
          priority: input.priority,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          active: input.active,
        };
        const saved = input.id
          ? await tx
              .update(s.pricingRules)
              .set(values)
              .where(
                and(
                  eq(s.pricingRules.id, input.id),
                  sql`${s.pricingRules}.xmin::text = ${input.version}`,
                ),
              )
              .returning({ id: s.pricingRules.id })
          : await tx
              .insert(s.pricingRules)
              .values(values)
              .returning({ id: s.pricingRules.id });
        const row = saved[0];
        if (!row) throw new RuleAdminError("stale");
        await tx.insert(s.auditLogs).values({
          origin: context.mode === "admin" ? "ADMIN" : "SYSTEM",
          actorId: context.mode === "admin" ? context.actorId! : null,
          action:
            context.mode === "admin"
              ? input.id
                ? "PRICING_RULE_UPDATE"
                : "PRICING_RULE_CREATE"
              : input.id
                ? "DEMO_PRICING_RULE_UPDATE"
                : "DEMO_PRICING_RULE_CREATE",
          entityType: "pricing_rule",
          entityId: row.id,
          requestId: crypto.randomUUID(),
          metadata: {
            reasonCode:
              context.mode === "admin"
                ? "ADMIN_PRICING_WORKSPACE"
                : "DEMO_PRICING_WORKSPACE",
            changedFields: Object.keys(values),
          },
        });
        return { id: row.id };
      },
      { isolationLevel: "serializable" },
    );
  } catch (error) {
    if (error instanceof RuleAdminError) throw error;
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "40001"
    )
      throw new RuleAdminError("stale");
    throw new RuleAdminError("unavailable");
  } finally {
    await pool.end();
  }
}

export async function readSimulation(
  productId: string,
  tierId: string,
  referenceTime?: string,
  context: PricingContext = demoContext,
) {
  checkContext(context);
  const data = await loadWorkspace(context.mode);
  const at = referenceTime ? new Date(referenceTime) : demoReferenceTime;
  if (!Number.isFinite(at.getTime())) throw new RuleAdminError("invalid");
  return {
    simulation: simulate(data, productId, tierId, at),
    tiers: tierComparison(data, productId, at).map((item) => ({
      tierId: item.tierId,
      tierName: item.tierName,
      priceIdr: item.simulation.chosen?.price?.sellingPriceIdr ?? null,
      issue: item.simulation.chosen?.issue ?? null,
    })),
  };
}
