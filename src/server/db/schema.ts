import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export * from "./schema/enums";
export * from "./schema/auth";
export * from "./schema/catalog";
export * from "./schema/providers";
export * from "./schema/pricing";
export * from "./schema/orders";
export * from "./schema/payments";
export * from "./schema/fulfillment";
export * from "./schema/wallet";
export * from "./schema/promotions";
export * from "./schema/referrals";
export * from "./schema/operations";

export const foundationMetadata = pgTable("foundation_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
