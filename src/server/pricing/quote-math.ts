export type PricingRule = {
  id: string;
  scope: "GLOBAL" | "CATEGORY" | "BRAND" | "PRODUCT" | "PROVIDER";
  categoryId: string | null;
  brandId: string | null;
  productId: string | null;
  tierId: string | null;
  fixedMarkupIdr: bigint;
  markupBps: number;
  minimumMarginIdr: bigint;
  active: boolean;
  priority: number;
  startsAt: Date | null;
  endsAt: Date | null;
};

const maxIdr = 9223372036854775807n;
const scopeRank = { PRODUCT: 0, BRAND: 1, CATEGORY: 2, GLOBAL: 3 } as const;

export function selectPricingRule(
  rules: PricingRule[],
  context: {
    productId: string;
    brandId: string | null;
    categoryId: string;
    tierId: string;
    referenceTime: Date;
  },
): PricingRule | null {
  return (
    rules
      .filter((rule) => {
        if (!rule.active || (rule.tierId && rule.tierId !== context.tierId))
          return false;
        if (rule.startsAt && rule.startsAt > context.referenceTime)
          return false;
        if (rule.endsAt && rule.endsAt <= context.referenceTime) return false;
        if (rule.scope === "PRODUCT")
          return rule.productId === context.productId;
        if (rule.scope === "BRAND")
          return rule.brandId === context.brandId && !!context.brandId;
        if (rule.scope === "CATEGORY")
          return rule.categoryId === context.categoryId;
        return rule.scope === "GLOBAL";
      })
      .sort(
        (a, b) =>
          scopeRank[a.scope as keyof typeof scopeRank] -
            scopeRank[b.scope as keyof typeof scopeRank] ||
          Number(b.tierId === context.tierId) -
            Number(a.tierId === context.tierId) ||
          a.priority - b.priority ||
          a.id.localeCompare(b.id),
      )[0] ?? null
  );
}

export function calculateCustomerPrice(
  costIdr: bigint,
  rule: PricingRule,
): bigint {
  if (
    costIdr < 0n ||
    costIdr > maxIdr ||
    rule.fixedMarkupIdr < 0n ||
    rule.minimumMarginIdr < 0n ||
    !Number.isInteger(rule.markupBps) ||
    rule.markupBps < 0 ||
    rule.markupBps > 100000
  )
    throw new RangeError("Invalid pricing configuration");
  const percentage = (costIdr * BigInt(rule.markupBps) + 9999n) / 10000n;
  const markup = rule.fixedMarkupIdr + percentage;
  const price =
    costIdr + (markup > rule.minimumMarginIdr ? markup : rule.minimumMarginIdr);
  if (price > maxIdr) throw new RangeError("Price exceeds IDR range");
  return price;
}

export function addPaymentFee(priceIdr: bigint, feeIdr: bigint): bigint {
  if (priceIdr < 0n || feeIdr < 0n || priceIdr + feeIdr > maxIdr)
    throw new RangeError("Invalid total");
  return priceIdr + feeIdr;
}
