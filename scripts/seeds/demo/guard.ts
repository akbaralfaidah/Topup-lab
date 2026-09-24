export class DemoSeedError extends Error {}

export function guardDemoEnvironment(
  env: Record<string, string | undefined>,
): URL {
  if (
    env.APP_MODE !== "demo" ||
    !["development", "test"].includes(env.NODE_ENV ?? "")
  ) {
    throw new DemoSeedError(
      "Demo seed requires explicit APP_MODE=demo and NODE_ENV=development or test.",
    );
  }
  if (
    env.VERCEL ||
    env.CI ||
    env.RAILWAY_ENVIRONMENT ||
    env.RENDER ||
    env.FLY_APP_NAME
  ) {
    throw new DemoSeedError(
      "Demo seed is restricted to a local interactive development environment.",
    );
  }
  let url: URL;
  let app: URL;
  try {
    url = new URL(env.DATABASE_URL ?? "");
    app = new URL(env.APP_URL ?? "");
  } catch {
    throw new DemoSeedError(
      "Explicit local DATABASE_URL and APP_URL are required.",
    );
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    url.hostname !== "127.0.0.1" ||
    url.port !== "55417" ||
    url.username !== "topuplab_local" ||
    !url.password ||
    url.search ||
    url.hash ||
    !/^\/topuplab_demo_[a-f0-9]{12}$/.test(url.pathname)
  ) {
    throw new DemoSeedError(
      "Demo seed only accepts the approved local PostgreSQL cluster and a topuplab_demo_<12 hex> database, without URL options.",
    );
  }
  if (
    !["http:", "https:"].includes(app.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(app.hostname)
  ) {
    throw new DemoSeedError("Demo seed refuses a nonlocal APP_URL.");
  }
  return url;
}
