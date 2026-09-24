import "server-only";

export function localDemoCatalogEnabled(): boolean {
  if (process.env.NODE_ENV === "production" || process.env.APP_MODE !== "demo")
    return false;
  const value = process.env.DATABASE_URL;
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      url.hostname === "127.0.0.1" &&
      url.port === "55417" &&
      url.username === "topuplab_local" &&
      /^topuplab_demo_[a-f0-9]{12}$/.test(url.pathname.slice(1))
    );
  } catch {
    return false;
  }
}
