import { getEnvironment } from "@/server/config/env";
import { getDatabase } from "@/server/db";
import { createRedis } from "@/server/redis/connection";
import { checkReadiness } from "@/server/health/readiness";
import { requestIdFrom } from "@/server/http/request-id";
import { errorResponse, AppError } from "@/server/http/errors";
import { logEvent } from "@/server/logging";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers);
  try {
    const redis = createRedis(getEnvironment().REDIS_URL);
    try {
      const result = await checkReadiness({
        database: () => getDatabase().pool.query("SELECT 1"),
        redis: async () => {
          await redis.connect();
          await redis.ping();
        },
      });
      if (!result.ready) {
        logEvent("error", { event: "readiness_failed", requestId });
        return errorResponse(
          new AppError("SERVICE_UNAVAILABLE", 503, "Layanan belum siap."),
          requestId,
        );
      }
      return Response.json(
        { status: "ready", requestId },
        { headers: { "x-request-id": requestId, "Cache-Control": "no-store" } },
      );
    } finally {
      redis.disconnect();
    }
  } catch (error) {
    logEvent("error", { event: "readiness_failed", requestId });
    return errorResponse(error, requestId);
  }
}
