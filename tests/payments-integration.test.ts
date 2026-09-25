import assert from "node:assert";
import { getDatabase } from "@/server/db";
import * as s from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { createPaymentForOrder } from "@/server/payments/create-payment";
import { processPaymentCallback } from "@/server/payments/callback";
import { createHmac } from "node:crypto";

const db = getDatabase().db;

async function runTest() {
  console.log("Starting Payment Lifecycle Integration");
  
  // 1. Setup Order
  const orderId = crypto.randomUUID();
  await db.insert(s.orders).values({
    id: orderId,
    publicReference: crypto.randomUUID(),
    totalIdr: 50000n,
    currency: "IDR",
    status: "WAITING_PAYMENT",
    idempotencyKey: orderId,
    contactEmail: "test@example.com",
  });

  // 2. Create Payment
  const reqId = crypto.randomUUID();
  const result = await createPaymentForOrder({
    orderId,
    gatewayCode: "DEMO",
    methodCode: "QRIS",
    category: "QRIS",
    idempotencyKey: reqId,
  });

  assert.strictEqual(result.state, "created");
  if (result.state !== "created") throw new Error("Failed to create");

  // 3. Idempotent replay
  const replayResult = await createPaymentForOrder({
    orderId,
    gatewayCode: "DEMO",
    methodCode: "QRIS",
    category: "QRIS",
    idempotencyKey: reqId,
  });
  assert.strictEqual(replayResult.state, "created");
  if (replayResult.state !== "created") throw new Error("Failed");
  assert.strictEqual(replayResult.paymentId, result.paymentId);

  // 4. Concurrency Test
  const orderId2 = crypto.randomUUID();
  await db.insert(s.orders).values({
    id: orderId2,
    publicReference: crypto.randomUUID(),
    totalIdr: 50000n,
    currency: "IDR",
    status: "WAITING_PAYMENT",
    idempotencyKey: orderId2,
    contactEmail: "test2@example.com",
  });

  const newReqId = crypto.randomUUID();
  const results = await Promise.all([
    createPaymentForOrder({
      orderId: orderId2,
      gatewayCode: "DEMO",
      methodCode: "QRIS",
      category: "QRIS",
      idempotencyKey: newReqId,
    }),
    createPaymentForOrder({
      orderId: orderId2,
      gatewayCode: "DEMO",
      methodCode: "QRIS",
      category: "QRIS",
      idempotencyKey: newReqId,
    })
  ]);

  // One should be created, the other conflict, OR both created returning the same paymentId if we handled it safely
  // Our implementation throws on unique violation and returns payment_conflict, or if it hit the select first it returns created.
  assert.strictEqual(results.some(r => r.state === "created"), true);

  // 5. Callback Verification (Valid)
  const eventKey = crypto.randomUUID();
  const payload = {
    eventId: eventKey,
    eventType: "PAYMENT_SUCCESS",
    status: "SUCCESS",
    gatewayReference: result.gatewayReference,
    amountIdr: "50000",
  };
  const rawBody = JSON.stringify(payload);
  const signature = createHmac("sha256", "local-development-demo-secret")
    .update(rawBody, "utf8")
    .digest("hex");

  const cbResult = await processPaymentCallback("DEMO", rawBody, {
    "x-demo-signature": signature,
  });

  assert.strictEqual(cbResult.ok, true);
  if (!cbResult.ok) throw new Error("Callback failed");
  assert.strictEqual(cbResult.state, "processed");

  // Verify DB Status
  const updatedPayment = await db
    .select()
    .from(s.payments)
    .where(eq(s.payments.id, result.paymentId))
    .limit(1);
  assert.strictEqual(updatedPayment[0]?.status, "PAID");

  const updatedOrder = await db
    .select()
    .from(s.orders)
    .where(eq(s.orders.id, orderId))
    .limit(1);
  assert.strictEqual(updatedOrder[0]?.status, "PAID");

  // 6. Deduplication Replay
  const cbReplay = await processPaymentCallback("DEMO", rawBody, {
    "x-demo-signature": signature,
  });
  assert.strictEqual(cbReplay.ok, true);
  if (cbReplay.ok) {
    assert.strictEqual(cbReplay.state, "duplicate");
  }

  // 7. Invalid Signature
  const badCbResult = await processPaymentCallback("DEMO", rawBody, {
    "x-demo-signature": "bad",
  });
  assert.strictEqual(badCbResult.ok, false);
  if (!badCbResult.ok) {
    assert.strictEqual(badCbResult.code, "INVALID_SIGNATURE");
  }
  // 8. Amount Mismatch
  const mismatchPayload = {
    ...payload,
    eventId: crypto.randomUUID(),
    amountIdr: "100",
  };
  const mismatchSig = createHmac("sha256", "local-development-demo-secret")
    .update(JSON.stringify(mismatchPayload), "utf8")
    .digest("hex");
  const mismatchCb = await processPaymentCallback("DEMO", JSON.stringify(mismatchPayload), {
    "x-demo-signature": mismatchSig,
  });
  assert.strictEqual(mismatchCb.ok, false);
  if (!mismatchCb.ok) {
    assert.strictEqual(mismatchCb.code, "AMOUNT_MISMATCH");
  }

  // 9. Currency Mismatch
  const currMismatchPayload = {
    ...payload,
    eventId: crypto.randomUUID(),
    currency: "USD",
  };
  const currMismatchSig = createHmac("sha256", "local-development-demo-secret")
    .update(JSON.stringify(currMismatchPayload), "utf8")
    .digest("hex");
  const currMismatchCb = await processPaymentCallback("DEMO", JSON.stringify(currMismatchPayload), {
    "x-demo-signature": currMismatchSig,
  });
  assert.strictEqual(currMismatchCb.ok, false);
  if (!currMismatchCb.ok) {
    assert.strictEqual(currMismatchCb.code, "AMOUNT_MISMATCH");
  }

  // 10. Out of order event (Pending after Paid)
  const pendingPayload = {
    ...payload,
    eventId: crypto.randomUUID(),
    status: "PENDING",
  };
  const pendingSig = createHmac("sha256", "local-development-demo-secret")
    .update(JSON.stringify(pendingPayload), "utf8")
    .digest("hex");
  const pendingCb = await processPaymentCallback("DEMO", JSON.stringify(pendingPayload), {
    "x-demo-signature": pendingSig,
  });
  // Since the payment is already PAID, it should ignore the PENDING event without throwing
  assert.strictEqual(pendingCb.ok, true);
  if (pendingCb.ok) {
    assert.strictEqual(pendingCb.state, "ignored");
  }

  console.log("Success: Payment Lifecycle Integration");
}

async function runLatePaidTest() {
  console.log("Starting Late PAID Test");
  
  const orderId = crypto.randomUUID();
  await db.insert(s.orders).values({
    id: orderId,
    publicReference: crypto.randomUUID(),
    totalIdr: 50000n,
    currency: "IDR",
    status: "EXPIRED",
    idempotencyKey: orderId,
    contactEmail: "late@example.com",
  });

  const reqId = crypto.randomUUID();
  const paymentId = crypto.randomUUID();
  const gatewayRef = `DEMO_REF_${reqId}`;
  await db.insert(s.payments).values({
    id: paymentId,
    orderId,
    gatewayCode: "DEMO",
    gatewayReference: gatewayRef,
    idempotencyKey: reqId,
    methodCode: "QRIS",
    category: "QRIS",
    currency: "IDR",
    amountIdr: 50000n,
    status: "EXPIRED",
    expiresAt: new Date(Date.now() - 100000),
  });

  const payload = {
    eventId: crypto.randomUUID(),
    eventType: "PAYMENT_SUCCESS",
    status: "SUCCESS",
    gatewayReference: gatewayRef,
    amountIdr: "50000",
  };
  const rawBody = JSON.stringify(payload);
  const signature = createHmac("sha256", "local-development-demo-secret")
    .update(rawBody, "utf8")
    .digest("hex");

  const cbResult = await processPaymentCallback("DEMO", rawBody, {
    "x-demo-signature": signature,
  });

  assert.strictEqual(cbResult.ok, true);
  
  const updatedOrder = await db.select().from(s.orders).where(eq(s.orders.id, orderId)).limit(1);
  assert.strictEqual(updatedOrder[0]?.status, "MANUAL_REVIEW");

  const history = await db.select().from(s.orderStatusHistory).where(eq(s.orderStatusHistory.orderId, orderId));
  assert.strictEqual(history.length, 1);
  assert.strictEqual(history[0]?.toStatus, "MANUAL_REVIEW");

  console.log("Success: Late PAID Test");
}

async function runDemoGatingTest() {
  console.log("Starting Demo Gating Test");
  const { getGateway } = await import("@/server/payments/registry");
  
  // Set production and no demo mode by passing a mock process.env, 
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppMode = process.env.APP_MODE;
  
  (process.env as any).NODE_ENV = "production";
  process.env.APP_MODE = "live";

  let error: any = null;
  try {
    getGateway("DEMO");
  } catch (e) {
    error = e;
  }
  assert.strictEqual(error?.message, "PAYMENT_UNAVAILABLE");

  (process.env as any).NODE_ENV = "development";
  process.env.APP_MODE = "demo";
  const gw = getGateway("DEMO");
  assert.strictEqual(gw.code, "DEMO");
  
  // Restore
  (process.env as any).NODE_ENV = originalNodeEnv;
  process.env.APP_MODE = originalAppMode;

  console.log("Success: Demo Gating Test");
}

async function runAll() {
  await runTest();
  await runLatePaidTest();
  await runDemoGatingTest();
}

runAll().catch((e) => {
  console.error("Test failed", e);
  process.exit(1);
});
