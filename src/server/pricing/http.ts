import { z } from "zod";

export const pricingRequestSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("simulate"),
    productId: z.uuid(),
    tierId: z.uuid(),
    referenceTime: z.string().datetime({ offset: true }).optional(),
  }),
  z.strictObject({
    action: z.literal("preview"),
    rule: z.unknown(),
    productId: z.uuid().optional(),
  }),
  z.strictObject({ action: z.literal("save"), rule: z.unknown() }),
]);
