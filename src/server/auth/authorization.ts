import "server-only";
import { currentIdentity, currentPermissions, currentSession } from "./session";
import type { PermissionCode } from "./policy";

export async function requireSession() {
  return currentSession();
}

export async function requirePermission(permission: PermissionCode) {
  return currentIdentity(permission);
}

export async function requireAdminAccess() {
  return requirePermission("admin.access");
}

export { currentPermissions };
