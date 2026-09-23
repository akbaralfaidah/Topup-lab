import { requestIdFrom } from "@/server/http/request-id";

export const dynamic = "force-dynamic";
export function GET(request: Request) {
  const requestId = requestIdFrom(request.headers);
  return Response.json(
    { status: "ok", requestId },
    { headers: { "x-request-id": requestId, "Cache-Control": "no-store" } },
  );
}
