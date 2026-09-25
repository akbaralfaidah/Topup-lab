import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createSessionToken,
  digestSessionToken,
  hashPassword,
  validSessionToken,
  verifyPassword,
} from "../src/server/auth/crypto";
import {
  emailSchema,
  loginSchema,
  passwordSchema,
  registrationSchema,
  safeReturnPath,
} from "../src/server/auth/input";
import { canAccess, rolePolicy } from "../src/server/auth/policy";

test("Argon2id verifies valid passwords and rejects wrong or malformed credentials", () => {
  const hash = hashPassword("a long password with spaces");
  assert.match(hash, /^\$argon2id\$v=19\$/);
  assert.ok(!hash.includes("long password"));
  assert.equal(verifyPassword("a long password with spaces", hash), true);
  assert.equal(verifyPassword("a different password", hash), false);
  assert.equal(verifyPassword("anything", "$argon2id$broken"), false);
  assert.equal(verifyPassword("anything", ""), false);
});

test("passwords are not trimmed and email identity is normalized", () => {
  assert.equal(emailSchema.parse("  USER@Example.COM  "), "user@example.com");
  assert.equal(
    registrationSchema.parse({
      email: " X@Example.COM ",
      password: " leading spaces are meaningful ",
    }).password,
    " leading spaces are meaningful ",
  );
  assert.equal(passwordSchema.safeParse("short").success, false);
  assert.equal(passwordSchema.safeParse("x".repeat(257)).success, false);
  assert.equal(
    loginSchema.safeParse({ email: "x@example.com", password: "x" }).success,
    true,
  );
});

test("session tokens are random opaque bearers and only digests are persisted", () => {
  const a = createSessionToken();
  const b = createSessionToken();
  assert.ok(validSessionToken(a.token));
  assert.notEqual(a.token, b.token);
  assert.equal(a.digest, digestSessionToken(a.token));
  assert.match(a.digest, /^[a-f0-9]{64}$/);
  assert.ok(!a.digest.includes(a.token));
  assert.equal(validSessionToken("not-a-bearer"), false);
});

test("return paths never leave the application", () => {
  assert.equal(
    safeReturnPath("/admin/pricing?tab=rules"),
    "/admin/pricing?tab=rules",
  );
  for (const value of [
    "//evil.example",
    "https://evil.example",
    "/\\evil.example",
    "",
    "/login",
    "/a\nSet-Cookie:x",
  ])
    assert.equal(safeReturnPath(value), "/account");
});

test("role policy is explicit and does not grant customers or resellers admin access", () => {
  assert.equal(canAccess(rolePolicy.CUSTOMER, "admin.access"), false);
  assert.equal(canAccess(rolePolicy.RESELLER, "pricing.read"), false);
  assert.equal(canAccess(rolePolicy.ADMIN, "pricing.write"), true);
  assert.equal(canAccess(rolePolicy.SUPER_ADMIN, "admin.access"), true);
  assert.equal(canAccess(["admin.access"], "pricing.write"), false);
});
