import "server-only";
import { getEnvironment } from "../config/env";
import { createDatabase } from "./connection";

const globalDatabase = globalThis as typeof globalThis & {
  topuplabDatabase?: ReturnType<typeof createDatabase>;
};
export function getDatabase() {
  globalDatabase.topuplabDatabase ??= createDatabase(
    getEnvironment().DATABASE_URL,
  );
  return globalDatabase.topuplabDatabase;
}
