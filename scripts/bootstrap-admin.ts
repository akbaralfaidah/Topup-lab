import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { parseEnvironment } from "../src/server/config/schema";
import { createDatabase } from "../src/server/db/connection";
import * as s from "../src/server/db/schema";
import { emailSchema } from "../src/server/auth/input";

const args = process.argv.slice(2);
const emailArg = args.find((arg) => arg.startsWith("--email="))?.slice(8);
const email = emailSchema.safeParse(emailArg);
if (
  process.env.AUTH_BOOTSTRAP_CONFIRM !== "GRANT_SUPER_ADMIN_TO_EXISTING_USER" ||
  !email.success ||
  args.length !== 1
) {
  console.error(
    "Set AUTH_BOOTSTRAP_CONFIRM and pass exactly --email=<existing account>.",
  );
  process.exit(1);
}
const { db, pool } = createDatabase(parseEnvironment(process.env).DATABASE_URL);
try {
  const user = await db
    .select({ id: s.users.id })
    .from(s.users)
    .where(
      and(
        eq(s.users.emailNormalized, email.data),
        eq(s.users.status, "ACTIVE"),
      ),
    )
    .limit(1);
  const role = await db
    .select({ id: s.roles.id })
    .from(s.roles)
    .where(and(eq(s.roles.code, "SUPER_ADMIN"), eq(s.roles.active, true)))
    .limit(1);
  if (!user[0] || !role[0]) throw new Error("Account or role unavailable");
  await db.transaction(async (tx) => {
    await tx
      .insert(s.userRoles)
      .values({ userId: user[0]!.id, roleId: role[0]!.id })
      .onConflictDoNothing();
    await tx.insert(s.auditLogs).values({
      actorId: null,
      origin: "SYSTEM",
      action: "ADMIN_BOOTSTRAP",
      entityType: "user",
      entityId: user[0]!.id,
      requestId: crypto.randomUUID(),
      metadata: { reasonCode: "EXPLICIT_OPERATOR_BOOTSTRAP" },
    });
  });
  console.info(
    "Privileged role granted to the selected existing account. No password was read or printed.",
  );
} catch {
  console.error(
    "Bootstrap failed. Check the selected account, seed, and database access.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
