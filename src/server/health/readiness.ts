export async function checkReadiness(checks: {
  database: () => Promise<unknown>;
  redis: () => Promise<unknown>;
}) {
  const [database, redis] = await Promise.allSettled([
    checks.database(),
    checks.redis(),
  ]);
  const dependencies = {
    database: database.status === "fulfilled",
    redis: redis.status === "fulfilled",
  };
  return { ready: dependencies.database && dependencies.redis, dependencies };
}
