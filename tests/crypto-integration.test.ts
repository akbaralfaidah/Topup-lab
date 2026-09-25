import { test, describe } from "node:test";
import * as assert from "node:assert";
import { randomBytes } from "node:crypto";

const testKey = randomBytes(32).toString("hex");
process.env.TARGET_ENCRYPTION_ACTIVE_KEY_ID = "v1";
process.env.TARGET_ENCRYPTION_KEYS = JSON.stringify({ v1: testKey });
process.env.QUOTE_HMAC_KEY = randomBytes(32).toString("hex");
process.env.GUEST_HMAC_KEY = randomBytes(32).toString("hex");

import { encryptTarget, decryptTarget } from "../src/server/crypto/target";
import {
  signQuote,
  verifyQuoteToken,
} from "../src/server/checkout/quote-token";
import {
  signGuestToken,
  verifyGuestToken,
} from "../src/server/checkout/guest-token";

describe("Target Encryption", () => {
  test("encrypt and decrypt round-trip", () => {
    const plaintext = JSON.stringify({ serverId: "123", userId: "abc" });
    const { ciphertext, keyReference } = encryptTarget(plaintext);

    assert.strictEqual(keyReference, "v1");
    assert.strictEqual(ciphertext.startsWith("v1:"), true);

    const decrypted = decryptTarget(ciphertext, keyReference);
    assert.strictEqual(decrypted, plaintext);
  });

  test("historical key decryption and rotation", () => {
    // 1. Simulate key v1 being active
    process.env.TARGET_ENCRYPTION_ACTIVE_KEY_ID = "v1";
    const v1Key = randomBytes(32).toString("hex");
    const v2Key = randomBytes(32).toString("hex");
    process.env.TARGET_ENCRYPTION_KEYS = JSON.stringify({
      v1: v1Key,
      v2: v2Key,
    });

    const plaintextA = "Order A Data";
    const { ciphertext: ciphertextA, keyReference: refA } =
      encryptTarget(plaintextA);
    assert.strictEqual(refA, "v1");

    // 2. Rotate to v2
    process.env.TARGET_ENCRYPTION_ACTIVE_KEY_ID = "v2";

    const plaintextB = "Order B Data";
    const { ciphertext: ciphertextB, keyReference: refB } =
      encryptTarget(plaintextB);
    assert.strictEqual(refB, "v2");

    // 3. Both should decrypt with their respective references
    assert.strictEqual(decryptTarget(ciphertextA, refA), plaintextA);
    assert.strictEqual(decryptTarget(ciphertextB, refB), plaintextB);
  });

  test("fails closed on unknown key reference", () => {
    const plaintext = "Secret Data";
    const { ciphertext } = encryptTarget(plaintext);

    assert.throws(
      () => decryptTarget(ciphertext, "v999"),
      /Encryption key v999 is unavailable/,
    );
  });

  test("tamper detection fails", () => {
    const plaintext = JSON.stringify({ data: "secret" });
    const { ciphertext, keyReference } = encryptTarget(plaintext);

    const parts = ciphertext.split(":");
    // tamper with the encrypted data
    const tamperedCiphertext = `${parts[0]}:${parts[1]}:${parts[2]}:00000000`;

    assert.throws(() => decryptTarget(tamperedCiphertext, keyReference));
  });
});

describe("Quote Token Signature", () => {
  test("sign and verify token", () => {
    const payload = {
      productSlug: "mlbb-100",
      payment: "QRIS",
      totalIdr: "15000",
    };
    const { token } = signQuote(payload);

    const verified = verifyQuoteToken(token);
    assert.notStrictEqual(verified, null);
    assert.strictEqual(verified?.productSlug, payload.productSlug);
    assert.strictEqual(verified?.payment, payload.payment);
    assert.strictEqual(verified?.totalIdr, payload.totalIdr);
  });

  test("tampered token fails verification", () => {
    const payload = {
      productSlug: "mlbb-100",
      payment: "QRIS",
      totalIdr: "15000",
    };
    const { token } = signQuote(payload);

    const tampered = token.slice(0, -5) + "abcde";
    const verified = verifyQuoteToken(tampered);
    assert.strictEqual(verified, null);
  });
});

describe("Guest Token Signature", () => {
  test("sign and verify guest token", () => {
    const ref = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const token = signGuestToken(ref);

    assert.strictEqual(verifyGuestToken(token, ref), true);
    assert.strictEqual(verifyGuestToken(token, "another-ref"), false);
  });
});
