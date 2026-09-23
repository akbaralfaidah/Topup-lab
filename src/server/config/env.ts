import "server-only";
import { parseEnvironment } from "./schema";

let cached: ReturnType<typeof parseEnvironment> | undefined;
export function getEnvironment() {
  cached ??= parseEnvironment(process.env);
  return cached;
}
