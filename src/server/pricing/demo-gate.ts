import "server-only";
import { localDemoCatalogEnabled } from "@/server/catalog-runtime";

export function localDemoPricingEnabled() {
  return process.env.NODE_ENV === "development" && localDemoCatalogEnabled();
}
