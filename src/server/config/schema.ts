import { z } from "zod";

function parsedUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

const connectionUrl = (protocols: string[]) =>
  z.string().refine((value) => {
    const url = parsedUrl(value);
    return (
      url !== undefined &&
      protocols.includes(url.protocol) &&
      url.hostname.length > 0
    );
  });

function decodedPassword(value: string): string {
  try {
    return decodeURIComponent(parsedUrl(value)?.password ?? "");
  } catch {
    return "";
  }
}

const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_MODE: z.enum(["demo", "live"]),
    DESIGN_LAB_ENABLED: z.enum(["true", "false"]).default("false"),
    APP_URL: connectionUrl(["http:", "https:"]),
    DATABASE_URL: connectionUrl(["postgres:", "postgresql:"]),
    REDIS_URL: connectionUrl(["redis:", "rediss:"]),
    TARGET_ENCRYPTION_ACTIVE_KEY_ID: z.string().min(1),
    TARGET_ENCRYPTION_KEYS: z.string().refine((val) => {
      try {
        const keys = JSON.parse(val);
        if (typeof keys !== "object" || keys === null) return false;
        for (const key of Object.values(keys)) {
          if (
            typeof key !== "string" ||
            key.length !== 64 ||
            !/^[a-fA-F0-9]+$/.test(key)
          ) {
            return false;
          }
        }
        return true;
      } catch {
        return false;
      }
    }, "Must be a JSON object mapping key IDs to 64-char hex strings"),
    QUOTE_HMAC_KEY: z.string().min(64).max(64),
    GUEST_HMAC_KEY: z.string().min(64).max(64),
    DEMO_PAYMENT_SECRET: z.string().default("local-development-demo-secret"),
  })
  .superRefine((env, ctx) => {
    if (
      env.NODE_ENV === "production" &&
      parsedUrl(env.APP_URL)?.protocol !== "https:"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["APP_URL"],
        message: "Production requires HTTPS",
      });
    }
    if (env.NODE_ENV === "production") {
      for (const key of ["DATABASE_URL", "REDIS_URL"] as const) {
        const password = decodedPassword(env[key]);
        if (
          password.length < 16 ||
          /change.me|example|replace|local-development-only/i.test(password)
        ) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: "A non-placeholder password is required",
          });
        }
      }
    }
  });

export type ServerEnvironment = z.infer<typeof schema>;

export function parseEnvironment(
  input: Record<string, unknown>,
): ServerEnvironment {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path.join("."))),
    ];
    throw new Error(`Invalid server environment: ${fields.join(", ")}`);
  }
  return result.data;
}
