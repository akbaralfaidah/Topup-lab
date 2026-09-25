import { getEnvironment } from "@/server/config/env";
import type { PaymentGateway } from "./gateway";
import { DemoPaymentGateway } from "./demo";

export function getGateway(code: string): PaymentGateway {
  const env = getEnvironment();
  const isProduction = process.env.NODE_ENV === "production" || process.env.APP_MODE === "live";
  const demoGatewayAllowed = !isProduction && process.env.APP_MODE === "demo";

  if (code === "DEMO") {
    if (!demoGatewayAllowed) {
      throw new Error("PAYMENT_UNAVAILABLE");
    }
    return new DemoPaymentGateway(env.DEMO_PAYMENT_SECRET);
  }

  throw new Error("PAYMENT_UNAVAILABLE");
}
