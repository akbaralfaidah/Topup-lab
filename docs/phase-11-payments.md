# Phase 11: Payment Gateway Abstraction + Persistent Payment Creation

## Overview
Phase 11 introduces the payment domain and gateway abstraction required to turn a `WAITING_PAYMENT` order into an external payment request. It provides an authoritative framework to track active payment attempts, process callbacks securely, and maintain order state coordination without yet executing fulfillment.

## Gateway Abstraction
A single unified `PaymentGateway` interface is defined in `src/server/payments/gateway.ts`. 
It exposes two primary contracts:
- `createPayment`: Translates an internal `PaymentGatewayRequest` into a provider-specific `PaymentGatewayResponse`.
- `verifyCallback`: Cryptographically verifies the raw provider webhook and normalizes its payload into a safe internal `PaymentGatewayCallbackResult`.

## Demo Gateway
A `DemoPaymentGateway` (`src/server/payments/demo.ts`) adapter is implemented for safe, local, and CI development.
- Automatically disabled in production when `APP_URL` includes `topuplab.com`.
- Generates synthetic deterministic instructions for `QRIS` and `VIRTUAL_ACCOUNT`.
- Cryptographically verifies incoming callbacks using a local `DEMO_PAYMENT_SECRET` via HMAC-SHA256.

## Payment Creation
The `createPaymentForOrder` service validates and coordinates payment attempts:
- Only processes orders in `WAITING_PAYMENT` or `PAYMENT_PENDING`.
- Strictly enforces payment amount mapping directly from the immutable `order.totalIdr`.
- Creates a `paymentId` uniquely associated with the returned `gatewayReference`.

## Idempotency
- Requests include a strict `idempotencyKey`.
- Attempting to recreate a payment with the same key returns the existing payment if parameters logically match.
- Database unique constraints act as the absolute backstop.

## Payment Lifecycle & State Coordination
When a verified `PAID` event arrives:
1. The `payment.status` advances to `PAID`.
2. The related `order.status` advances to `PAID` within the same transaction.
3. An immutable `orderStatusHistory` event is appended.
4. The event processing status is tracked in `paymentEventProcessing`.

## Callback Verification & Event Deduplication
- Each callback signature is explicitly validated by the gateway adapter *before* trusting its payload.
- Duplicate incoming hooks fail safely without executing duplicate paid transitions using the `unique` constraint on `(gatewayCode, eventKey)` in `paymentEvents`.
- Repeated valid `PAID` notifications gracefully short-circuit to an `ignored` state, safeguarding order immutability.

## Amount Verification
- If a verified callback provides a mismatched `amountIdr`, the event is recorded for audit but the processing halts abruptly with `AMOUNT_MISMATCH`. The order does NOT transition to `PAID`.

## Security Boundary
- Customers can only access payment creation if they hold the authenticated session or guest capabilities associated with the specific order.
- Server-side gateway secrets (like `DEMO_PAYMENT_SECRET`) are kept strictly out of client builds.

## Phase 12+ Boundaries
- Currently, successful payment transitions the order to `PAID` and stops. It does not queue fulfillment, contact a provider, or send emails. These capabilities await provider adapters in Phase 12.
