import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  boolean,
  integer,
  jsonb,
  check,
  index,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { accountStatus, actorOrigin } from "./enums";
import {
  id,
  instant,
  createdAt,
  timestamps,
  restrict,
  nonnegative,
  objectJson,
} from "./shared";
import type { TierBenefits } from "./validation";

export const users = pgTable(
  "users",
  {
    id: id(),
    emailNormalized: text("email_normalized").unique(),
    phoneNormalized: text("phone_normalized").unique(),
    emailVerifiedAt: instant("email_verified_at"),
    phoneVerifiedAt: instant("phone_verified_at"),
    status: accountStatus("status").default("ACTIVE").notNull(),
    ...timestamps(),
  },
  (t) => [
    check(
      "users_identity_required",
      sql`${t.emailNormalized} IS NOT NULL OR ${t.phoneNormalized} IS NOT NULL`,
    ),
    check(
      "users_email_normalized",
      sql`${t.emailNormalized} = lower(btrim(${t.emailNormalized})) AND length(${t.emailNormalized}) BETWEEN 3 AND 254 AND position('@' in ${t.emailNormalized}) > 1`,
    ),
    check(
      "users_phone_e164",
      sql`${t.phoneNormalized} ~ '^[+][1-9][0-9]{7,14}$'`,
    ),
    check(
      "users_verification_identity",
      sql`(${t.emailVerifiedAt} IS NULL OR ${t.emailNormalized} IS NOT NULL) AND (${t.phoneVerifiedAt} IS NULL OR ${t.phoneNormalized} IS NOT NULL)`,
    ),
  ],
);
export const passwordCredentials = pgTable(
  "password_credentials",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, restrict),
    passwordHash: text("password_hash").notNull(),
    ...timestamps(),
  },
  (t) => [
    check(
      "credentials_hash_encoding",
      sql`${t.passwordHash} LIKE '$argon2id$%'`,
    ),
  ],
);
export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, restrict),
    tokenDigest: text("token_digest").notNull().unique(),
    expiresAt: instant("expires_at").notNull(),
    revokedAt: instant("revoked_at"),
    lastSeenAt: instant("last_seen_at"),
    createdAt: createdAt(),
  },
  (t) => [
    index("sessions_user_idx").on(t.userId),
    index("sessions_expiry_idx").on(t.expiresAt),
    check("sessions_digest_sha256", sql`${t.tokenDigest} ~ '^[0-9a-f]{64}$'`),
    check(
      "sessions_expiry_after_creation",
      sql`${t.expiresAt} > ${t.createdAt}`,
    ),
  ],
);
export const roles = pgTable("roles", {
  id: id(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps(),
});
export const permissions = pgTable("permissions", {
  id: id(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  createdAt: createdAt(),
});
export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, restrict),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, restrict),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.roleId] }),
    index("user_roles_role_idx").on(t.roleId),
  ],
);
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, restrict),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, restrict),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.roleId, t.permissionId] }),
    index("role_permissions_permission_idx").on(t.permissionId),
  ],
);
export const membershipTiers = pgTable(
  "membership_tiers",
  {
    id: id(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    level: integer("level").notNull(),
    benefits: jsonb("benefits").$type<TierBenefits>().notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps(),
  },
  (t) => [
    nonnegative("tiers_level_nonnegative", t.level),
    objectJson("tiers_benefits_object", t.benefits),
  ],
);
export const customerProfiles = pgTable(
  "customer_profiles",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, restrict),
    displayName: text("display_name"),
    membershipTierId: uuid("membership_tier_id").references(
      () => membershipTiers.id,
      restrict,
    ),
    membershipExpiresAt: instant("membership_expires_at"),
    ...timestamps(),
  },
  (t) => [index("profiles_tier_idx").on(t.membershipTierId)],
);
export const membershipHistory = pgTable(
  "membership_history",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, restrict),
    previousTierId: uuid("previous_tier_id").references(
      () => membershipTiers.id,
      restrict,
    ),
    newTierId: uuid("new_tier_id").references(
      () => membershipTiers.id,
      restrict,
    ),
    reasonCode: text("reason_code").notNull(),
    origin: actorOrigin("origin").notNull(),
    actorId: uuid("actor_id").references(() => users.id, restrict),
    effectiveAt: instant("effective_at").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: createdAt(),
  },
  (t) => [
    index("membership_history_user_date_idx").on(t.userId, t.effectiveAt),
    check(
      "membership_change_distinct",
      sql`${t.previousTierId} IS DISTINCT FROM ${t.newTierId}`,
    ),
    unique("membership_history_id_user_unique").on(t.id, t.userId),
  ],
);
