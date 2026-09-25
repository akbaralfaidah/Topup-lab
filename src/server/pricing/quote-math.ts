export type RuleScope =
  "GLOBAL" | "CATEGORY" | "BRAND" | "PRODUCT" | "PROVIDER";
export type PricingRule = {
  id: string;
  name?: string;
  scope: RuleScope;
  categoryId: string | null;
  brandId: string | null;
  productId: string | null;
  providerId?: string | null;
  tierId: string | null;
  fixedMarkupIdr: bigint;
  markupBps: number;
  minimumMarginIdr: bigint;
  active: boolean;
  priority: number;
  startsAt: Date | null;
  endsAt: Date | null;
};

export type PricingContext = {
  productId: string;
  brandId: string | null;
  categoryId: string;
  providerId?: string | null;
  tierId: string;
  referenceTime: Date;
};

export type InternalPrice = {
  providerCostIdr: bigint;
  commercialRule: PricingRule;
  providerFloorRule: PricingRule | null;
  commercialPercentageIdr: bigint;
  commercialMarkupIdr: bigint;
  providerFloorIdr: bigint | null;
  sellingPriceIdr: bigint;
  expectedMarginIdr: bigint;
  calculatedAt: Date;
};

export class PricingConflictError extends Error {
  constructor() {
    super("Conflicting pricing rules");
  }
}

export const maxIdr = 9223372036854775807n;
export type CostFreshness = "unknown" | "recent" | "stale" | "future";
export function classifyCostFreshness(
  lastSyncedAt: Date | null,
  referenceTime: Date,
  maximumAgeMs = 7 * 86400000,
): CostFreshness {
  if (!Number.isFinite(referenceTime.getTime()) || maximumAgeMs < 0)
    throw new RangeError("Invalid freshness policy");
  if (!lastSyncedAt) return "unknown";
  if (!Number.isFinite(lastSyncedAt.getTime()))
    throw new RangeError("Invalid cost timestamp");
  const age = referenceTime.getTime() - lastSyncedAt.getTime();
  return age < 0 ? "future" : age > maximumAgeMs ? "stale" : "recent";
}
const scopeRank = { PRODUCT: 0, BRAND: 1, CATEGORY: 2, GLOBAL: 3 } as const;

function targetIsValid(rule: PricingRule): boolean {
  const targets = [
    rule.categoryId,
    rule.brandId,
    rule.productId,
    rule.providerId ?? null,
  ];
  const present = targets.filter(Boolean).length;
  return rule.scope === "GLOBAL"
    ? present === 0
    : present === 1 &&
        (rule.scope === "CATEGORY"
          ? !!rule.categoryId
          : rule.scope === "BRAND"
            ? !!rule.brandId
            : rule.scope === "PRODUCT"
              ? !!rule.productId
              : !!rule.providerId);
}

function inWindow(rule: PricingRule, at: Date): boolean {
  if (
    Number.isNaN(at.getTime()) ||
    (rule.startsAt && Number.isNaN(rule.startsAt.getTime())) ||
    (rule.endsAt && Number.isNaN(rule.endsAt.getTime())) ||
    (rule.startsAt && rule.endsAt && rule.endsAt <= rule.startsAt)
  )
    throw new RangeError("Invalid pricing schedule");
  return (
    (!rule.startsAt || rule.startsAt <= at) &&
    (!rule.endsAt || at < rule.endsAt)
  );
}

function relevant(rule: PricingRule, context: PricingContext): boolean {
  if (!targetIsValid(rule)) throw new RangeError("Invalid pricing target");
  if (!rule.active || (rule.tierId && rule.tierId !== context.tierId))
    return false;
  if (!inWindow(rule, context.referenceTime)) return false;
  switch (rule.scope) {
    case "PRODUCT":
      return rule.productId === context.productId;
    case "BRAND":
      return !!context.brandId && rule.brandId === context.brandId;
    case "CATEGORY":
      return rule.categoryId === context.categoryId;
    case "PROVIDER":
      return !!context.providerId && rule.providerId === context.providerId;
    case "GLOBAL":
      return true;
  }
}

function sortedRules(
  rules: PricingRule[],
  context: PricingContext,
): PricingRule[] {
  return rules.sort(
    (a, b) =>
      (a.scope === "PROVIDER" ? 0 : scopeRank[a.scope]) -
        (b.scope === "PROVIDER" ? 0 : scopeRank[b.scope]) ||
      Number(b.tierId === context.tierId) -
        Number(a.tierId === context.tierId) ||
      a.priority - b.priority ||
      a.id.localeCompare(b.id),
  );
}

function winner(
  rules: PricingRule[],
  context: PricingContext,
): PricingRule | null {
  const ordered = sortedRules(rules, context);
  const first = ordered[0];
  const second = ordered[1];
  if (
    first &&
    second &&
    first.scope === second.scope &&
    (first.tierId === context.tierId) === (second.tierId === context.tierId) &&
    first.priority === second.priority
  )
    throw new PricingConflictError();
  return first ?? null;
}

export function selectPricingRule(
  rules: PricingRule[],
  context: PricingContext,
): PricingRule | null {
  return winner(
    rules.filter(
      (rule) => rule.scope !== "PROVIDER" && relevant(rule, context),
    ),
    context,
  );
}

export function selectProviderFloorRule(
  rules: PricingRule[],
  context: PricingContext,
): PricingRule | null {
  return winner(
    rules.filter(
      (rule) => rule.scope === "PROVIDER" && relevant(rule, context),
    ),
    context,
  );
}

function parts(costIdr: bigint, rule: PricingRule) {
  if (
    costIdr < 0n ||
    costIdr > maxIdr ||
    rule.fixedMarkupIdr < 0n ||
    rule.fixedMarkupIdr > maxIdr ||
    rule.minimumMarginIdr < 0n ||
    rule.minimumMarginIdr > maxIdr ||
    !Number.isInteger(rule.markupBps) ||
    rule.markupBps < 0 ||
    rule.markupBps > 100000
  )
    throw new RangeError("Invalid pricing configuration");
  const percentageIdr = (costIdr * BigInt(rule.markupBps) + 9999n) / 10000n;
  const calculatedMarkupIdr = rule.fixedMarkupIdr + percentageIdr;
  const markupIdr =
    calculatedMarkupIdr > rule.minimumMarginIdr
      ? calculatedMarkupIdr
      : rule.minimumMarginIdr;
  const priceIdr = costIdr + markupIdr;
  if (priceIdr > maxIdr) throw new RangeError("Price exceeds IDR range");
  return { percentageIdr, markupIdr, priceIdr };
}

export function calculateCustomerPrice(
  costIdr: bigint,
  rule: PricingRule,
): bigint {
  return parts(costIdr, rule).priceIdr;
}

export function calculatePricing(
  costIdr: bigint,
  rules: PricingRule[],
  context: PricingContext,
): InternalPrice | null {
  const commercialRule = selectPricingRule(rules, context);
  if (!commercialRule) return null;
  const providerFloorRule = selectProviderFloorRule(rules, context);
  const commercial = parts(costIdr, commercialRule);
  const providerFloor = providerFloorRule
    ? parts(costIdr, providerFloorRule)
    : null;
  const sellingPriceIdr =
    providerFloor && providerFloor.priceIdr > commercial.priceIdr
      ? providerFloor.priceIdr
      : commercial.priceIdr;
  return {
    providerCostIdr: costIdr,
    commercialRule,
    providerFloorRule,
    commercialPercentageIdr: commercial.percentageIdr,
    commercialMarkupIdr: commercial.markupIdr,
    providerFloorIdr: providerFloor?.priceIdr ?? null,
    sellingPriceIdr,
    expectedMarginIdr: sellingPriceIdr - costIdr,
    calculatedAt: new Date(context.referenceTime),
  };
}

export function addPaymentFee(priceIdr: bigint, feeIdr: bigint): bigint {
  if (priceIdr < 0n || feeIdr < 0n || priceIdr + feeIdr > maxIdr)
    throw new RangeError("Invalid total");
  return priceIdr + feeIdr;
}
