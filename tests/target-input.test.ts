import assert from "node:assert/strict";
import test from "node:test";
import { validateTarget } from "../src/lib/target-input";
import type { InputDefinition } from "../src/server/db/schema/validation";

const ml: InputDefinition = {
  version: 1,
  fields: [
    {
      key: "user_id",
      label: "ID pengguna",
      format: "DIGITS",
      required: true,
      minLength: 4,
      maxLength: 20,
    },
    {
      key: "zone_id",
      label: "ID zona",
      format: "DIGITS",
      required: true,
      minLength: 1,
      maxLength: 8,
    },
  ],
};

test("dynamic target validation normalizes, masks, and rejects extra credentials", () => {
  const valid = validateTarget(ml, { user_id: " 123 456 ", zone_id: " 10 " });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.deepEqual(valid.normalized, { user_id: "123456", zone_id: "10" });
    assert.deepEqual(
      valid.masked.map((item) => item.value),
      ["••••3456", "••••"],
    );
  }
  const invalid = validateTarget(ml, {
    user_id: "abc",
    zone_id: "",
    password: "secret",
  });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.match(invalid.errors.form ?? "", /tidak dikenali/);
  const malformed = validateTarget(ml, { user_id: "abcd", zone_id: "10" });
  assert.equal(malformed.ok, false);
});

test("phone input accepts Indonesian local form and validates E.164", () => {
  const phone: InputDefinition = {
    version: 1,
    fields: [
      {
        key: "phone_number",
        label: "Nomor ponsel",
        format: "PHONE_E164",
        required: true,
        minLength: 11,
        maxLength: 16,
      },
    ],
  };
  const valid = validateTarget(phone, { phone_number: "0812-3456-7890" });
  assert.equal(valid.ok, true);
  if (valid.ok) assert.equal(valid.normalized.phone_number, "+6281234567890");
  assert.equal(validateTarget(phone, { phone_number: "123" }).ok, false);
});
