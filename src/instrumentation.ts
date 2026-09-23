export async function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getEnvironment } = await import("./server/config/env");
    try {
      getEnvironment();
    } catch {
      console.error(
        "Server configuration invalid. Check required environment variables.",
      );
      process.exit(1);
    }
  }
}
