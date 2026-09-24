import { z } from "zod";

const shortText = z.string().trim().min(1).max(160);
export const productMetadataSchema = z.strictObject({
  tags: z.array(shortText).max(20).optional(),
  seoTitle: shortText.optional(),
  seoDescription: z.string().max(320).optional(),
});
export const inputDefinitionSchema = z
  .strictObject({
    version: z.literal(1),
    fields: z
      .array(
        z
          .strictObject({
            key: z.enum([
              "user_id",
              "zone_id",
              "phone_number",
              "customer_number",
              "meter_number",
              "nickname",
            ]),
            label: shortText,
            format: z.enum(["TEXT", "DIGITS", "PHONE_E164"]),
            required: z.boolean(),
            minLength: z.number().int().min(1).max(128),
            maxLength: z.number().int().min(1).max(128),
          })
          .refine((field) => field.maxLength >= field.minLength),
      )
      .min(1)
      .max(6),
  })
  .refine(
    (value) =>
      new Set(value.fields.map((field) => field.key)).size ===
      value.fields.length,
    "Field keys must be unique",
  );
export const tierBenefitsSchema = z.strictObject({
  descriptions: z.array(shortText).max(12),
});
export const providerMetadataSchema = z.strictObject({
  catalogVersion: shortText.optional(),
  regionCode: z
    .string()
    .regex(/^[A-Z0-9_-]{1,16}$/)
    .optional(),
});
export const safeEventSchema = z.strictObject({
  responseCode: z
    .string()
    .regex(/^[A-Za-z0-9_.:-]{1,64}$/)
    .optional(),
  sourceVersion: shortText.optional(),
  amountMatched: z.boolean().optional(),
});
export const auditMetadataSchema = z.strictObject({
  changedFields: z
    .array(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/))
    .max(30)
    .optional(),
  reasonCode: z
    .string()
    .regex(/^[A-Z0-9_]{1,64}$/)
    .optional(),
});
export const settingValueSchema = z.discriminatedUnion("key", [
  z.strictObject({
    key: z.literal("PUBLIC_CONTACT"),
    value: z.strictObject({
      email: z.email(),
      phone: z
        .string()
        .regex(/^\+[1-9][0-9]{7,14}$/)
        .optional(),
    }),
  }),
  z.strictObject({
    key: z.literal("RECEIPT_COPY"),
    value: z.strictObject({ footer: z.string().max(320) }),
  }),
  z.strictObject({
    key: z.literal("CATALOG_PAGE_SIZE"),
    value: z.strictObject({ count: z.number().int().min(12).max(48) }),
  }),
]);
export const idrSchema = z.bigint().min(0n).max(9223372036854775807n);
export const basisPointsSchema = z.number().int().min(0).max(10000);

export type ProductMetadata = z.infer<typeof productMetadataSchema>;
export type InputDefinition = z.infer<typeof inputDefinitionSchema>;
export type TierBenefits = z.infer<typeof tierBenefitsSchema>;
export type ProviderMetadata = z.infer<typeof providerMetadataSchema>;
export type SafeEvent = z.infer<typeof safeEventSchema>;
export type AuditMetadata = z.infer<typeof auditMetadataSchema>;
export type SettingValue = z.infer<typeof settingValueSchema>["value"];
