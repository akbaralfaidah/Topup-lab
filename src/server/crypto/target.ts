import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

function getKeyRing(): { activeId: string; keys: Record<string, string> } {
  const activeId = process.env.TARGET_ENCRYPTION_ACTIVE_KEY_ID;
  if (!activeId) throw new Error("Missing TARGET_ENCRYPTION_ACTIVE_KEY_ID");

  const keysRaw = process.env.TARGET_ENCRYPTION_KEYS;
  if (!keysRaw) throw new Error("Missing TARGET_ENCRYPTION_KEYS");

  let keys: Record<string, string>;
  try {
    keys = JSON.parse(keysRaw);
  } catch {
    throw new Error("Invalid TARGET_ENCRYPTION_KEYS format");
  }

  if (!keys[activeId]) {
    throw new Error("Active key ID not found in TARGET_ENCRYPTION_KEYS");
  }

  return { activeId, keys };
}

export function encryptTarget(plaintext: string): {
  ciphertext: string;
  keyReference: string;
} {
  const { activeId, keys } = getKeyRing();
  const hexKey = keys[activeId];
  if (!hexKey) throw new Error("Active key missing");

  const key = Buffer.from(hexKey, "hex");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const ciphertext = `v1:${nonce.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
  const keyReference = activeId;

  return { ciphertext, keyReference };
}

export function decryptTarget(
  ciphertextData: string,
  keyReference?: string,
): string {
  const { keys } = getKeyRing();

  const parts = ciphertextData.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Invalid target ciphertext format");
  }

  // Backward compatibility for existing records lacking explicit keyReference argument
  // If keyReference is not provided, we might fail or assume activeId. But the DB schema HAS targetKeyReference!
  // It should be passed into decryptTarget!
  if (!keyReference) {
    throw new Error("Key reference is required for decryption");
  }

  const hexKey = keys[keyReference];
  if (!hexKey) {
    throw new Error(`Encryption key ${keyReference} is unavailable`);
  }

  const noncePart = parts[1];
  const tagPart = parts[2];
  const encryptedPart = parts[3];
  
  if (!noncePart || !tagPart || !encryptedPart) {
    throw new Error("Invalid target ciphertext format");
  }

  const key = Buffer.from(hexKey, "hex");
  const nonce = Buffer.from(noncePart, "hex");
  const tag = Buffer.from(tagPart, "hex");
  const encrypted = Buffer.from(encryptedPart, "hex");

  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
