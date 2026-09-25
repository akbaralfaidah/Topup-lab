import { z } from "zod";
import { maxIdr, type RuleScope } from "./quote-math";

const uuid = z.uuid();
const digits = z.string().regex(/^(0|[1-9][0-9]*)$/);
const iso = z.string().datetime({ offset: true });

export const ruleInputSchema = z.strictObject({
  id: uuid.nullable(),
  version: z
    .string()
    .regex(/^[0-9]{1,20}$/)
    .nullable(),
  name: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[\p{L}\p{N} .,_()/-]+$/u),
  scope: z.enum(["GLOBAL", "CATEGORY", "BRAND", "PRODUCT", "PROVIDER"]),
  targetId: uuid.nullable(),
  tierId: uuid.nullable(),
  fixedMarkupIdr: digits.max(19),
  percentage: z.string().regex(/^(0|[1-9][0-9]{0,3})(\.[0-9]{1,2})?$/),
  minimumMarginIdr: digits.max(19),
  priority: z.number().int().min(0).max(10000),
  startsAt: iso.nullable(),
  endsAt: iso.nullable(),
  active: z.boolean(),
});

export type RuleInput = z.infer<typeof ruleInputSchema>;
export type ParsedRuleInput = Omit<
  RuleInput,
  "fixedMarkupIdr" | "percentage" | "minimumMarginIdr"
> & {
  fixedMarkupIdr: bigint;
  markupBps: number;
  minimumMarginIdr: bigint;
};

export function parsePercentage(value: string): number {
  if (!/^(0|[1-9][0-9]{0,3})(\.[0-9]{1,2})?$/.test(value))
    throw new RangeError("Invalid percentage");
  const [whole, decimal = ""] = value.split(".");
  const bps = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  if (bps > 100000) throw new RangeError("Invalid percentage");
  return bps;
}

export function parseRuleInput(value: unknown): ParsedRuleInput {
  const input = ruleInputSchema.parse(value);
  if ((input.id === null) !== (input.version === null))
    throw new RangeError("Invalid version");
  if ((input.scope === "GLOBAL") !== (input.targetId === null))
    throw new RangeError("Invalid scope target");
  if (
    (input.startsAt && Number.isNaN(new Date(input.startsAt).getTime())) ||
    (input.endsAt && Number.isNaN(new Date(input.endsAt).getTime())) ||
    (input.startsAt &&
      input.endsAt &&
      new Date(input.endsAt) <= new Date(input.startsAt))
  )
    throw new RangeError("Invalid schedule");
  const fixedMarkupIdr = BigInt(input.fixedMarkupIdr);
  const minimumMarginIdr = BigInt(input.minimumMarginIdr);
  if (fixedMarkupIdr > maxIdr || minimumMarginIdr > maxIdr)
    throw new RangeError("IDR exceeds database range");
  return {
    ...input,
    fixedMarkupIdr,
    minimumMarginIdr,
    markupBps: parsePercentage(input.percentage),
  };
}

export function targetColumns(scope: RuleScope, targetId: string | null) {
  return {
    categoryId: scope === "CATEGORY" ? targetId : null,
    brandId: scope === "BRAND" ? targetId : null,
    productId: scope === "PRODUCT" ? targetId : null,
    providerId: scope === "PROVIDER" ? targetId : null,
  };
}

export function windowsOverlap(
  left: { startsAt: Date | null; endsAt: Date | null },
  right: { startsAt: Date | null; endsAt: Date | null },
): boolean {
  const aStart = left.startsAt?.getTime() ?? -Infinity;
  const aEnd = left.endsAt?.getTime() ?? Infinity;
  const bStart = right.startsAt?.getTime() ?? -Infinity;
  const bEnd = right.endsAt?.getTime() ?? Infinity;
  return aStart < bEnd && bStart < aEnd;
}
