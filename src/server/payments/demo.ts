import { createHmac } from "node:crypto";
import type { PaymentGateway, PaymentGatewayRequest, PaymentGatewayResponse, PaymentGatewayCallbackResult } from "./gateway";

export class DemoPaymentGateway implements PaymentGateway {
  readonly code = "DEMO";

  private readonly secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  async createPayment(request: PaymentGatewayRequest): Promise<PaymentGatewayResponse> {
    const expiresAt = new Date(Date.now() + (request.expiresInSeconds ?? 900) * 1000);
    const gatewayReference = `demo_txn_${request.idempotencyKey.replace(/-/g, "").substring(0, 16)}`;

    let instruction: Record<string, unknown> = {};

    if (request.methodCode === "QRIS") {
      instruction = {
        type: "QR_CODE",
        payload: "00020101021226500010ID.CO.DEMO...DEMO_PAYLOAD",
        label: "QR pembayaran demo \u2014 tidak dapat digunakan untuk pembayaran nyata.",
      };
    } else if (request.category === "VIRTUAL_ACCOUNT") {
      instruction = {
        type: "VIRTUAL_ACCOUNT",
        bankName: "Demo Bank",
        accountNumber: `8888${request.idempotencyKey.replace(/\D/g, "").substring(0, 8)}`,
        label: "Virtual Account demo \u2014 tidak dapat digunakan untuk pembayaran nyata.",
      };
    } else {
      instruction = {
        type: "GENERIC",
        label: `Instruksi pembayaran demo untuk metode ${request.methodCode}.`,
      };
    }

    return {
      gatewayReference,
      customerInstruction: instruction,
      expiresAt,
    };
  }

  async getPaymentByIdempotencyKey(idempotencyKey: string): Promise<PaymentGatewayResponse | null> {
    const expiresAt = new Date(Date.now() + 900 * 1000);
    const gatewayReference = `demo_txn_${idempotencyKey.replace(/-/g, "").substring(0, 16)}`;
    return {
      gatewayReference,
      customerInstruction: { type: "GENERIC", label: "Recovered demo payment." },
      expiresAt,
    };
  }

  async verifyCallback(rawBody: string, headers: Record<string, string>): Promise<PaymentGatewayCallbackResult> {
    const signature = headers["x-demo-signature"];
    if (!signature) {
      throw new Error("Missing callback signature");
    }

    const expectedSignature = createHmac("sha256", this.secretKey)
      .update(rawBody, "utf8")
      .digest("hex");

    if (signature !== expectedSignature) {
      throw new Error("Invalid callback signature");
    }

    const payload = JSON.parse(rawBody);

    const eventKey = payload.eventId;
    const eventType = payload.eventType;
    const gatewayReference = payload.gatewayReference;
    const status = payload.status;
    const amountIdr = payload.amountIdr ? BigInt(payload.amountIdr) : undefined;
    const currency = payload.currency;

    let normalizedStatus: PaymentGatewayCallbackResult["normalizedStatus"];
    switch (status) {
      case "PAID":
      case "SUCCESS":
        normalizedStatus = "PAID";
        break;
      case "EXPIRED":
        normalizedStatus = "EXPIRED";
        break;
      case "FAILED":
        normalizedStatus = "FAILED";
        break;
      default:
        normalizedStatus = "PENDING";
    }

    return {
      eventKey,
      eventType,
      normalizedStatus,
      gatewayReference,
      amountIdr,
      currency,
      safePayload: {
        rawStatus: status,
        message: payload.message ?? "",
      },
    };
  }
}
