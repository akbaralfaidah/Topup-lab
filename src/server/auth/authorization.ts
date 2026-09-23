import { AppError } from "../http/errors";

export function requireAdmin(): never {
  // Deny access until verified sessions and role authorization exist in Phase 9.
  throw new AppError("ACCESS_DENIED", 403, "Akses admin belum tersedia.");
}
