import "server-only";
import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDatabase } from "@/server/db";
import * as s from "@/server/db/schema";
import { digestSessionToken, validSessionToken } from "./crypto";
import { canAccess, type PermissionCode } from "./policy";

export const sessionCookieName = "topuplab_session";
export const sessionLifetimeSeconds = 60 * 60 * 24 * 14;

export async function currentSession() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!validSessionToken(token)) return null;
  const db = getDatabase().db;
  const rows = await db
    .select({
      sessionId: s.sessions.id,
      userId: s.users.id,
      email: s.users.emailNormalized,
      status: s.users.status,
      expiresAt: s.sessions.expiresAt,
      membership: s.membershipTiers.name,
    })
    .from(s.sessions)
    .innerJoin(s.users, eq(s.sessions.userId, s.users.id))
    .leftJoin(s.customerProfiles, eq(s.customerProfiles.userId, s.users.id))
    .leftJoin(
      s.membershipTiers,
      eq(s.customerProfiles.membershipTierId, s.membershipTiers.id),
    )
    .where(
      and(
        eq(s.sessions.tokenDigest, digestSessionToken(token)),
        isNull(s.sessions.revokedAt),
        gt(s.sessions.expiresAt, new Date()),
        eq(s.users.status, "ACTIVE"),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function currentPermissions(userId: string) {
  const db = getDatabase().db;
  const rows = await db
    .select({ code: s.permissions.code })
    .from(s.userRoles)
    .innerJoin(s.roles, eq(s.userRoles.roleId, s.roles.id))
    .innerJoin(s.rolePermissions, eq(s.rolePermissions.roleId, s.roles.id))
    .innerJoin(
      s.permissions,
      eq(s.rolePermissions.permissionId, s.permissions.id),
    )
    .where(and(eq(s.userRoles.userId, userId), eq(s.roles.active, true)));
  return new Set(rows.map((row) => row.code));
}

export async function currentIdentity(required?: PermissionCode) {
  const session = await currentSession();
  if (!session) return null;
  if (!required) return session;
  const permissions = await currentPermissions(session.userId);
  return canAccess([...permissions], required) ? session : null;
}
