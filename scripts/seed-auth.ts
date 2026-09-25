import "dotenv/config";
import { eq } from "drizzle-orm";
import { parseEnvironment } from "../src/server/config/schema";
import { createDatabase } from "../src/server/db/connection";
import * as s from "../src/server/db/schema";
import { permissionCodes, rolePolicy } from "../src/server/auth/policy";

const { db, pool } = createDatabase(parseEnvironment(process.env).DATABASE_URL);
try {
  await db.transaction(async (tx) => {
    for (const [code, granted] of Object.entries(rolePolicy)) {
      await tx
        .insert(s.roles)
        .values({ code, name: code.replace("_", " "), active: true })
        .onConflictDoNothing();
      const [role] = await tx
        .select({ id: s.roles.id })
        .from(s.roles)
        .where(eq(s.roles.code, code))
        .limit(1);
      if (!role) throw new Error("Role seed failed");
      for (const permission of permissionCodes) {
        await tx
          .insert(s.permissions)
          .values({ code: permission, description: permission })
          .onConflictDoNothing();
        if (!granted.includes(permission)) continue;
        const [row] = await tx
          .select({ id: s.permissions.id })
          .from(s.permissions)
          .where(eq(s.permissions.code, permission))
          .limit(1);
        if (!row) throw new Error("Permission seed failed");
        await tx
          .insert(s.rolePermissions)
          .values({ roleId: role.id, permissionId: row.id })
          .onConflictDoNothing();
      }
    }
  });
  console.info("Auth roles and permissions seeded; no user promoted.");
} catch {
  console.error(
    "Auth seed failed. Apply migrations and check database access.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
