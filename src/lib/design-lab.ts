export function isDesignLabAllowed(env: {
  NODE_ENV: string;
  APP_MODE: string;
  DESIGN_LAB_ENABLED?: string;
}): boolean {
  return (
    env.APP_MODE === "demo" &&
    (env.NODE_ENV === "development" || env.DESIGN_LAB_ENABLED === "true")
  );
}
