export type PaymentMethodCategory = "QRIS" | "VIRTUAL_ACCOUNT" | "EWALLET" | "RETAIL" | "WALLET";

export type PaymentGatewayRequest = {
  orderId: string;
  amountIdr: bigint;
  methodCode: string;
  category: PaymentMethodCategory;
  idempotencyKey: string;
  expiresInSeconds?: number;
};

export type PaymentGatewayResponse = {
  gatewayReference: string;
  customerInstruction: Record<string, unknown>;
  expiresAt: Date;
};

export type PaymentGatewayCallbackResult = {
  eventKey: string;
  eventType: string;
  normalizedStatus: "CREATED" | "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED";
  gatewayReference: string;
  amountIdr?: bigint;
  currency?: string;
  safePayload: Record<string, unknown>;
};

export interface PaymentGateway {
  code: string;

  /**
   * Creates a payment at the external provider.
   * If the gateway supports idempotency natively, the adapter should map
   * the orderId or a provided key.
   */
  createPayment(request: PaymentGatewayRequest): Promise<PaymentGatewayResponse>;

  /**
   * Reconciles a payment by idempotencyKey to recover a lost reference.
   * Returns null if the gateway has no record of this key.
   */
  getPaymentByIdempotencyKey(idempotencyKey: string): Promise<PaymentGatewayResponse | null>;

  /**
   * Verifies the authenticity of a callback request.
   * Throws if invalid.
   */
  verifyCallback(rawBody: string, headers: Record<string, string>): Promise<PaymentGatewayCallbackResult>;
}
