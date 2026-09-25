import {
  argon2Sync,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const memory = 19_456;
const passes = 2;
const parallelism = 1;
const tagLength = 32;
const encoding = "$argon2id$v=19$m=19456,t=2,p=1$";

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = argon2Sync("argon2id", {
    message: Buffer.from(password, "utf8"),
    nonce: salt,
    memory,
    passes,
    parallelism,
    tagLength,
  });
  return `${encoding}${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const match =
    /^\$argon2id\$v=19\$m=19456,t=2,p=1\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{43})$/.exec(
      encoded,
    );
  if (!match) return false;
  const salt = Buffer.from(match[1]!, "base64url");
  const expected = Buffer.from(match[2]!, "base64url");
  if (salt.length !== 16 || expected.length !== tagLength) return false;
  try {
    const actual = argon2Sync("argon2id", {
      message: Buffer.from(password, "utf8"),
      nonce: salt,
      memory,
      passes,
      parallelism,
      tagLength,
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function createSessionToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, digest: digestSessionToken(token) };
}

export function digestSessionToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function validSessionToken(token: string | undefined): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}
