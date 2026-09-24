import {
  inputDefinitionSchema,
  type InputDefinition,
} from "@/server/db/schema/validation";

export type TargetValidation =
  | {
      ok: true;
      normalized: Record<string, string>;
      masked: { label: string; value: string }[];
    }
  | { ok: false; errors: Record<string, string> };

function normalize(
  value: string,
  format: InputDefinition["fields"][number]["format"],
) {
  const trimmed = value.trim();
  if (format === "PHONE_E164") {
    const compact = trimmed.replace(/[\s-]/g, "");
    return compact.startsWith("08") ? `+62${compact.slice(1)}` : compact;
  }
  return format === "TEXT"
    ? trimmed.replace(/\s+/g, " ")
    : trimmed.replace(/\s/g, "");
}

export function validateTarget(
  definition: InputDefinition,
  raw: unknown,
): TargetValidation {
  const schema = inputDefinitionSchema.safeParse(definition);
  if (
    !schema.success ||
    typeof raw !== "object" ||
    raw === null ||
    Array.isArray(raw)
  )
    return { ok: false, errors: { form: "Data akun belum dapat diperiksa." } };
  const input = raw as Record<string, unknown>;
  const allowed = new Set<string>(schema.data.fields.map((field) => field.key));
  if (Object.keys(input).some((key) => !allowed.has(key)))
    return { ok: false, errors: { form: "Ada isian yang tidak dikenali." } };
  const normalized: Record<string, string> = {};
  const masked: { label: string; value: string }[] = [];
  const errors: Record<string, string> = {};
  for (const field of schema.data.fields) {
    const value = input[field.key];
    if (typeof value !== "string" || value.length > 256) {
      errors[field.key] = `${field.label} wajib diisi.`;
      continue;
    }
    const clean = normalize(value, field.format);
    if (!clean && field.required)
      errors[field.key] = `${field.label} wajib diisi.`;
    else if (clean.length < field.minLength || clean.length > field.maxLength)
      errors[field.key] =
        `${field.label} harus ${field.minLength}–${field.maxLength} karakter.`;
    else if (field.format === "DIGITS" && !/^[0-9]+$/.test(clean))
      errors[field.key] = `Gunakan angka saja untuk ${field.label}.`;
    else if (
      field.format === "PHONE_E164" &&
      !/^\+[1-9][0-9]{7,14}$/.test(clean)
    )
      errors[field.key] = "Gunakan nomor Indonesia dengan awalan +62 atau 08.";
    else if (field.format === "TEXT" && /[\u0000-\u001f\u007f]/.test(clean))
      errors[field.key] = `${field.label} berisi karakter yang tidak didukung.`;
    if (!errors[field.key]) {
      normalized[field.key] = clean;
      masked.push({
        label: field.label,
        value: clean.length <= 4 ? "••••" : `••••${clean.slice(-4)}`,
      });
    }
  }
  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, normalized, masked };
}
