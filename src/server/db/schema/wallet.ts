import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  check,
  index,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { orders } from "./orders";
import {
  accountStatus,
  actorOrigin,
  currency,
  ledgerDirection,
  walletBucket,
  ledgerReferenceType,
} from "./enums";
import { id, createdAt, timestamps, money, restrict } from "./shared";

export const walletAccounts = pgTable(
  "wallet_accounts",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, restrict),
    currency: currency("currency").default("IDR").notNull(),
    status: accountStatus("status").default("ACTIVE").notNull(),
    ...timestamps(),
  },
  (t) => [
    unique("wallet_user_currency_unique").on(t.userId, t.currency),
    unique("wallet_currency_identity_unique").on(t.id, t.currency),
  ],
);
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: id(),
    walletAccountId: uuid("wallet_account_id").notNull(),
    currency: currency("currency").default("IDR").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    journalReference: uuid("journal_reference").notNull(),
    referenceType: ledgerReferenceType("reference_type").notNull(),
    referenceId: uuid("reference_id").notNull(),
    orderId: uuid("order_id").references(() => orders.id, restrict),
    direction: ledgerDirection("direction").notNull(),
    bucket: walletBucket("bucket").default("AVAILABLE").notNull(),
    amountIdr: money("amount_idr").notNull(),
    reasonCode: text("reason_code").notNull(),
    origin: actorOrigin("origin").notNull(),
    actorId: uuid("actor_id").references(() => users.id, restrict),
    correctsEntryId: uuid("corrects_entry_id"),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "ledger_wallet_currency_fk",
      columns: [t.walletAccountId, t.currency],
      foreignColumns: [walletAccounts.id, walletAccounts.currency],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    unique("ledger_correction_identity_unique").on(
      t.id,
      t.walletAccountId,
      t.currency,
    ),
    foreignKey({
      name: "ledger_correction_same_wallet_fk",
      columns: [t.correctsEntryId, t.walletAccountId, t.currency],
      foreignColumns: [t.id, t.walletAccountId, t.currency],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    index("ledger_wallet_created_idx").on(t.walletAccountId, t.createdAt),
    index("ledger_order_idx").on(t.orderId),
    index("ledger_journal_idx").on(t.journalReference),
    index("ledger_reference_idx").on(t.referenceType, t.referenceId),
    index("ledger_correction_idx").on(t.correctsEntryId),
    check("ledger_amount_positive", sql`${t.amountIdr} > 0`),
    check(
      "ledger_correction_not_self",
      sql`${t.correctsEntryId} IS NULL OR ${t.correctsEntryId} <> ${t.id}`,
    ),
    check(
      "ledger_order_reference",
      sql`${t.referenceType} <> 'ORDER' OR (${t.orderId} IS NOT NULL AND ${t.referenceId} = ${t.orderId})`,
    ),
  ],
);
