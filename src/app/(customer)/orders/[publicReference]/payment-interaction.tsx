"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PaymentInteraction({
  publicReference,
  status,
  hasPayment,
  paymentStatus,
  instruction,
  expiresAt,
}: {
  publicReference: string;
  status: string;
  hasPayment: boolean;
  paymentStatus?: string | null;
  instruction?: Record<string, unknown> | null;
  expiresAt?: Date | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${publicReference}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gatewayCode: "DEMO",
          methodCode: "QRIS", // Hardcode for now or pass from order
          category: "QRIS",
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Gagal membuat pembayaran.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "WAITING_PAYMENT" && !hasPayment) {
    return (
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button
          onClick={handleCreatePayment}
          disabled={loading}
          style={{
            background: "var(--color-primary)",
            color: "var(--color-ink-inverse)",
            padding: "1rem 2rem",
            borderRadius: "0.5rem",
            border: "none",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            width: "100%",
          }}
        >
          {loading ? "Memproses..." : "Buat Pembayaran"}
        </button>
      </div>
    );
  }

  if (hasPayment) {
    return (
      <div
        style={{
          background: "var(--color-surface-raised)",
          padding: "1.5rem",
          borderRadius: "1rem",
          marginTop: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", fontWeight: 600 }}>
          Instruksi Pembayaran
        </h2>
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ color: "var(--color-ink-muted)", fontSize: "0.875rem" }}>
            Status Pembayaran
          </p>
          <p style={{ fontWeight: 600, fontSize: "1.125rem" }}>{paymentStatus}</p>
        </div>
        
        {expiresAt && paymentStatus !== "PAID" && paymentStatus !== "EXPIRED" && (
            <div style={{ marginBottom: "1rem" }}>
                <p style={{ color: "var(--color-ink-muted)", fontSize: "0.875rem" }}>Batas Waktu</p>
                <p style={{ fontWeight: 600 }}>{new Date(expiresAt).toLocaleString("id-ID")}</p>
            </div>
        )}

        {instruction && paymentStatus !== "PAID" && (
          <div
            style={{
              background: "var(--color-surface-sunken)",
              padding: "1rem",
              borderRadius: "0.5rem",
              fontFamily: "monospace",
            }}
          >
            {!!instruction.label && (
              <p style={{ color: "var(--color-ink-muted)", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                {String(instruction.label)}
              </p>
            )}
            {instruction.type === "QR_CODE" && (
              <div style={{ textAlign: "center", padding: "1rem", background: "white", borderRadius: "0.5rem" }}>
                <div style={{ width: "200px", height: "200px", margin: "0 auto", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#888" }}>[Demo QR Code]</span>
                </div>
                <p style={{ marginTop: "1rem", fontWeight: 700, color: "black", wordBreak: "break-all" }}>
                    {String(instruction.payload)}
                </p>
              </div>
            )}
            {instruction.type === "VIRTUAL_ACCOUNT" && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>{String(instruction.bankName)}</p>
                <p style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "2px", marginTop: "0.5rem" }}>
                  {String(instruction.accountNumber)}
                </p>
              </div>
            )}
          </div>
        )}

        {paymentStatus === "PAID" && (
            <div style={{ background: "var(--color-success-subtle)", color: "var(--color-success-strong)", padding: "1rem", borderRadius: "0.5rem", marginTop: "1rem", textAlign: "center", fontWeight: 600 }}>
                Pembayaran diterima.
                <div style={{ fontSize: "0.875rem", fontWeight: 400, marginTop: "0.25rem" }}>Pesanan menunggu proses berikutnya.</div>
            </div>
        )}
      </div>
    );
  }

  return null;
}
