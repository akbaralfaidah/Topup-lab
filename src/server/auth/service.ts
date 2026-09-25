import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getDatabase } from "@/server/db";
import * as s from "@/server/db/schema";
import {
  createSessionToken,
  digestSessionToken,
  hashPassword,
  validSessionToken,
  verifyPassword,
} from "./crypto";
import { registrationSchema, loginSchema } from "./input";
import { sessionLifetimeSeconds } from "./session";

export class AuthError extends Error {
  constructor(public code: "invalid" | "duplicate" | "unavailable") {
    super(code);
  }
}

function hasUniqueViolation(error: unknown): boolean {
  let current = error;
  for (
    let depth = 0;
    depth < 3 && current && typeof current === "object";
    depth++
  ) {
    if ("code" in current && current.code === "23505") return true;
    current = "cause" in current ? current.cause : null;
  }
  return false;
}

export async function registerCustomer(input: unknown) {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) throw new AuthError("invalid");
  const passwordHash = hashPassword(parsed.data.password);
  const db = getDatabase().db;
  try {
    return await db.transaction(async (tx) => {
      const role = await tx
        .select({ id: s.roles.id })
        .from(s.roles)
        .where(and(eq(s.roles.code, "CUSTOMER"), eq(s.roles.active, true)))
        .limit(1);
      if (!role[0]) throw new AuthError("unavailable");
      const [user] = await tx
        .insert(s.users)
        .values({ emailNormalized: parsed.data.email, status: "ACTIVE" })
        .returning({ id: s.users.id });
      if (!user) throw new AuthError("unavailable");
      await tx
        .insert(s.passwordCredentials)
        .values({ userId: user.id, passwordHash });
      await tx
        .insert(s.userRoles)
        .values({ userId: user.id, roleId: role[0].id });
      const [tier] = await tx
        .select({ id: s.membershipTiers.id })
        .from(s.membershipTiers)
        .where(
          and(
            eq(s.membershipTiers.code, "PUBLIC"),
            eq(s.membershipTiers.active, true),
          ),
        )
        .limit(1);
      await tx
        .insert(s.customerProfiles)
        .values({ userId: user.id, membershipTierId: tier?.id ?? null });
      return user.id;
    });
  } catch (error) {
    if (error instanceof AuthError) throw error;
    if (hasUniqueViolation(error)) throw new AuthError("duplicate");
    throw new AuthError("unavailable");
  }
}

const dummyHash = hashPassword("not-a-real-account-password");

export async function authenticate(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) throw new AuthError("invalid");
  const db = getDatabase().db;
  const rows = await db
    .select({
      id: s.users.id,
      status: s.users.status,
      passwordHash: s.passwordCredentials.passwordHash,
    })
    .from(s.users)
    .leftJoin(
      s.passwordCredentials,
      eq(s.passwordCredentials.userId, s.users.id),
    )
    .where(eq(s.users.emailNormalized, parsed.data.email))
    .limit(1);
  const found = rows[0];
  const verified = verifyPassword(
    parsed.data.password,
    found?.passwordHash ?? dummyHash,
  );
  if (!verified || !found || found.status !== "ACTIVE")
    throw new AuthError("invalid");
  return found.id;
}

export async function issueSession(userId: string) {
  const { token, digest } = createSessionToken();
  const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1000);
  await getDatabase()
    .db.insert(s.sessions)
    .values({ userId, tokenDigest: digest, expiresAt });
  return { token, expiresAt };
}

export async function revokeSession(token: string | undefined) {
  if (!validSessionToken(token)) return;
  await getDatabase()
    .db.update(s.sessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(s.sessions.tokenDigest, digestSessionToken(token)),
        isNull(s.sessions.revokedAt),
      ),
    );
}
