export class AppError extends Error {
  constructor(
    public readonly code: "ACCESS_DENIED" | "SERVICE_UNAVAILABLE",
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(error: unknown, requestId: string) {
  const known = error instanceof AppError;
  return Response.json(
    {
      error: {
        code: known ? error.code : "INTERNAL_ERROR",
        message: known ? error.message : "Terjadi kendala. Silakan coba lagi.",
        requestId,
      },
    },
    {
      status: known ? error.status : 500,
      headers: { "x-request-id": requestId, "Cache-Control": "no-store" },
    },
  );
}
