import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDatabase } from "@/server/db";
import * as s from "@/server/db/schema";
import { currentSession } from "@/server/auth/session";
import { cookies } from "next/headers";
import {
  GUEST_COOKIE_NAME,
  verifyGuestToken,
} from "@/server/checkout/guest-token";
import { PaymentInteraction } from "./payment-interaction";

function formatIdr(value: string | bigint | number): string {
  return `Rp${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

const statusMap: Record<string, string> = {
  WAITING_PAYMENT: "Menunggu Pembayaran",
  CANCELLED: "Dibatalkan",
  PAYMENT_PENDING: "Memeriksa Pembayaran",
  PAID: "Dibayar",
  PROCESSING: "Diproses",
  SUCCESS: "Berhasil",
  FAILED: "Gagal",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ publicReference: string }>;
}) {
  const { publicReference } = await params;
  const db = getDatabase().db;

  const orderRows = await db
    .select({
      id: s.orders.id,
      publicReference: s.orders.publicReference,
      totalIdr: s.orders.totalIdr,
      status: s.orders.status,
      customerId: s.orders.customerId,
      createdAt: s.orders.createdAt,
    })
    .from(s.orders)
    .where(eq(s.orders.publicReference, publicReference))
    .limit(1);

  const order = orderRows[0];
  if (!order) notFound();

  // Access control
  const session = await currentSession();

  if (order.customerId) {
    // Authenticated order
    if (session?.userId !== order.customerId) {
      // Missing proper authenticated access or IDOR attempt
      notFound();
    }
  } else {
    // Guest order
    const guestCookie = (await cookies()).get(GUEST_COOKIE_NAME)?.value;
    if (!guestCookie || !verifyGuestToken(guestCookie, publicReference)) {
      notFound();
    }
  }

  const items = await db
    .select({
      productName: s.orderItems.productNameSnapshot,
      quantity: s.orderItems.quantity,
      lineTotal: s.orderItems.lineTotalIdr,
    })
    .from(s.orderItems)
    .where(eq(s.orderItems.orderId, order.id));

  const item = items[0];

  const payments = await db
    .select()
    .from(s.payments)
    .where(eq(s.payments.orderId, order.id))
    .limit(1);

  const payment = payments[0];
  let instruction: Record<string, unknown> | null = null;
  if (payment && payment.gatewayCode === "DEMO") {
    // Ideally we reconstruct this properly or fetch from gateway.
    // For demo, we can just deterministically generate it again.
    const { getGateway } = await import("@/server/payments/registry");
    const gateway = getGateway(payment.gatewayCode);
    const resp = await gateway.getPaymentByIdempotencyKey(payment.idempotencyKey);
    instruction = resp?.customerInstruction ?? null;
  }

  return (
    <main
      className="customer-main"
      style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem 1rem" }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Pesanan Dibuat</h1>
        <p style={{ color: "var(--color-ink-muted)", marginTop: "0.5rem" }}>
          Referensi: {publicReference}
        </p>
      </header>

      <div
        style={{
          background: "var(--color-surface-raised)",
          padding: "1.5rem",
          borderRadius: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{ fontSize: "1.25rem", marginBottom: "1rem", fontWeight: 600 }}
        >
          Status
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "1.125rem", color: "var(--color-ink)" }}>
            {statusMap[order.status] ?? order.status}
          </span>
          <span style={{ fontWeight: 700, fontSize: "1.25rem" }}>
            {formatIdr(order.totalIdr)}
          </span>
        </div>
      </div>

      <div
        style={{
          background: "var(--color-surface-raised)",
          padding: "1.5rem",
          borderRadius: "1rem",
        }}
      >
        <h2
          style={{ fontSize: "1.25rem", marginBottom: "1rem", fontWeight: 600 }}
        >
          Rincian
        </h2>
        {item ? (
          <dl
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <dt style={{ color: "var(--color-ink-muted)" }}>Produk</dt>
              <dd style={{ fontWeight: 500 }}>{item.productName}</dd>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <dt style={{ color: "var(--color-ink-muted)" }}>Tanggal</dt>
              <dd style={{ fontWeight: 500 }}>
                {new Date(order.createdAt).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </div>
          </dl>
        ) : (
          <p>Memuat rincian...</p>
        )}
      </div>

      <PaymentInteraction
        publicReference={publicReference}
        status={order.status}
        hasPayment={!!payment}
        paymentStatus={payment?.status}
        instruction={instruction}
        expiresAt={payment?.expiresAt}
      />
    </main>
  );
}
