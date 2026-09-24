import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  index,
  unique,
  uniqueIndex,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { orders } from "./orders";
import { accountStatus, referralState } from "./enums";
import {
  id,
  createdAt,
  timestamps,
  money,
  restrict,
  nonnegative,
} from "./shared";

export const referralCodes = pgTable(
  "referral_codes",
  {
    id: id(),
    ownerId: uuid("owner_id")
      .notNull()
      .unique()
      .references(() => users.id, restrict),
    code: text("code").notNull().unique(),
    status: accountStatus("status").default("ACTIVE").notNull(),
    ...timestamps(),
  },
  (t) => [
    unique("referral_code_owner_identity_unique").on(t.id, t.ownerId),
    check("referral_code_normalized", sql`${t.code} ~ '^[A-Z0-9_-]{4,32}$'`),
  ],
);
export const referralEvents = pgTable(
  "referral_events",
  {
    id: id(),
    referralCodeId: uuid("referral_code_id").notNull(),
    referrerId: uuid("referrer_id")
      .notNull()
      .references(() => users.id, restrict),
    referredUserId: uuid("referred_user_id").references(
      () => users.id,
      restrict,
    ),
    orderId: uuid("order_id").references(() => orders.id, restrict),
    state: referralState("state").notNull(),
    rewardIdr: money("reward_idr"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "referral_event_code_owner_fk",
      columns: [t.referralCodeId, t.referrerId],
      foreignColumns: [referralCodes.id, referralCodes.ownerId],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    uniqueIndex("referral_registered_user_unique")
      .on(t.referredUserId)
      .where(sql`${t.state} = 'REGISTERED'`),
    unique("referral_order_state_unique").on(
      t.referredUserId,
      t.orderId,
      t.state,
    ),
    index("referral_events_referrer_date_idx").on(t.referrerId, t.createdAt),
    index("referral_events_code_idx").on(t.referralCodeId),
    index("referral_events_order_idx").on(t.orderId),
    check(
      "referral_not_self",
      sql`${t.referredUserId} IS NULL OR ${t.referredUserId} <> ${t.referrerId}`,
    ),
    check(
      "referral_user_after_click",
      sql`${t.state} = 'CLICKED' OR ${t.referredUserId} IS NOT NULL`,
    ),
    check(
      "referral_qualification_order",
      sql`${t.state} IN ('CLICKED', 'REGISTERED') OR ${t.orderId} IS NOT NULL`,
    ),
    check(
      "referral_reward_state",
      sql`(${t.state} IN ('REWARDED', 'REVERSED') AND ${t.rewardIdr} IS NOT NULL AND ${t.rewardIdr} > 0) OR (${t.state} NOT IN ('REWARDED', 'REVERSED') AND ${t.rewardIdr} IS NULL)`,
    ),
    nonnegative("referral_reward_nonnegative", t.rewardIdr),
  ],
);
