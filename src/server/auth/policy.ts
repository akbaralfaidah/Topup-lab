export const permissionCodes = [
  "admin.access",
  "pricing.read",
  "pricing.write",
] as const;
export type PermissionCode = (typeof permissionCodes)[number];

export const rolePolicy: Record<
  "CUSTOMER" | "RESELLER" | "ADMIN" | "SUPER_ADMIN",
  readonly PermissionCode[]
> = {
  CUSTOMER: [],
  RESELLER: [],
  ADMIN: ["admin.access", "pricing.read", "pricing.write"],
  SUPER_ADMIN: ["admin.access", "pricing.read", "pricing.write"],
};

export function canAccess(
  permissions: readonly string[],
  required: PermissionCode,
) {
  return permissions.includes(required);
}
