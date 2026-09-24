import "dotenv/config";
import { seedDemo } from "./seeds/demo/seed";
import { DemoSeedError } from "./seeds/demo/guard";

try {
  const result = await seedDemo(process.env);
  console.info(`Demo dataset ${result.action}. Fictional local fixtures only.`);
  console.info(JSON.stringify(result));
} catch (error) {
  const databaseCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : null;
  const databaseConstraint =
    typeof error === "object" &&
    error !== null &&
    "constraint" in error &&
    typeof error.constraint === "string"
      ? error.constraint
      : null;
  console.error(
    error instanceof DemoSeedError
      ? error.message
      : `Demo seed failed and rolled back. Database code: ${databaseCode ?? "unavailable"}; constraint: ${databaseConstraint ?? "unavailable"}. No connection details were logged.`,
  );
  process.exitCode = 1;
}
