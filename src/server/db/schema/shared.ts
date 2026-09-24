import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  integer,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const id = () => uuid("id").defaultRandom().primaryKey();
export const instant = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });
export const createdAt = () => instant("created_at").defaultNow().notNull();
export const timestamps = () => ({
  createdAt: createdAt(),
  updatedAt: instant("updated_at").defaultNow().notNull(),
});
export const money = (name: string) => bigint(name, { mode: "bigint" });
export const basisPoints = (name: string) => integer(name);
export const restrict = { onDelete: "restrict", onUpdate: "restrict" } as const;
export const nonnegative = (name: string, column: AnyPgColumn) =>
  check(name, sql`${column} >= 0`);
export const rateRange = (name: string, column: AnyPgColumn, maximum = 10000) =>
  check(name, sql`${column} BETWEEN 0 AND ${sql.raw(String(maximum))}`);
export const schedule = (name: string, start: AnyPgColumn, end: AnyPgColumn) =>
  check(name, sql`${end} IS NULL OR ${start} IS NULL OR ${end} > ${start}`);
export const objectJson = (name: string, column: AnyPgColumn) =>
  check(name, sql`jsonb_typeof(${column}) = 'object'`);
