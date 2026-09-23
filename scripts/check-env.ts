import "dotenv/config";
import { parseEnvironment } from "../src/server/config/schema";

try {
  const env = parseEnvironment(process.env);
  console.info(`Environment valid (${env.NODE_ENV}, ${env.APP_MODE}).`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Environment validation failed.",
  );
  process.exitCode = 1;
}
