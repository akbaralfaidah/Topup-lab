import { z } from "zod";

export const emailSchema = z
  .string()
  .min(3)
  .max(254)
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.email().max(254));

export const passwordSchema = z.string().min(12).max(256);

export const registrationSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1).max(256),
});

export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return "/account";
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value))
    return "/account";
  try {
    const parsed = new URL(value, "https://topuplab.invalid");
    return parsed.origin === "https://topuplab.invalid" &&
      parsed.pathname !== "/login"
      ? `${parsed.pathname}${parsed.search}`
      : "/account";
  } catch {
    return "/account";
  }
}
