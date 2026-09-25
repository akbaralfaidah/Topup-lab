"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, CircleAlert } from "lucide-react";
import { motion } from "motion/react";
import type { InputDefinition } from "@/server/db/schema/validation";
import { validateTarget } from "@/lib/target-input";
import { useMotionPolicy } from "@/lib/motion/use-motion-policy";
import { useRouter } from "next/navigation";
import {
  DenominationOption,
  PaymentMethodRow,
  PriceBreakdown,
  SmartCheckoutBar,
} from "@/components/commerce/foundations";
import type { DemoPayment, PublicQuote } from "@/server/pricing/preview";

export function formatIdr(value: string | null): string {
  return value === null
    ? "—"
    : `Rp${value.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

type QuoteResponse =
  | {
      state: "ready";
      quote: PublicQuote;
      maskedTarget?: { label: string; value: string }[];
    }
  | { state: string; errors?: Record<string, string> };

const paymentOptions: {
  code: DemoPayment;
  label: string;
  description: string;
}[] = [
  {
    code: "QRIS",
    label: "QRIS",
    description: "Metode contoh · biaya tampil di ringkasan",
  },
  {
    code: "VA",
    label: "Virtual Account",
    description: "Metode contoh · biaya tampil di ringkasan",
  },
  {
    code: "EWALLET",
    label: "E-Wallet",
    description: "Metode contoh · biaya tampil di ringkasan",
  },
];

export function PreparationForm({
  name,
  category,
  products,
  definition,
}: {
  name: string;
  category: string;
  products: PublicQuote[];
  definition: InputDefinition;
}) {
  const [target, setTarget] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [payment, setPayment] = useState<DemoPayment | null>(null);
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [review, setReview] = useState<{
    maskedTarget: { label: string; value: string }[];
    quote: PublicQuote;
  } | null>(null);
  const requestId = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const sectionId = useId();
  const { reduced, transition } = useMotionPolicy();
  const router = useRouter();

  useEffect(() => () => controllerRef.current?.abort(), []);

  function loadQuote(productSlug: string, method: DemoPayment) {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const current = ++requestId.current;
    setPending(true);
    setQuote(null);
    setMessage("");
    setReview(null);
    fetch("/api/demo/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug,
        payment: method,
      }),
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => response.json() as Promise<QuoteResponse>)
      .then((result) => {
        if (current !== requestId.current) return;
        if (result.state === "ready" && "quote" in result)
          setQuote(result.quote);
        else
          setMessage(
            "Harga contoh belum dapat dimuat. Pilih nominal lagi atau coba nanti.",
          );
      })
      .catch(() => {
        if (current === requestId.current && !controller.signal.aborted)
          setMessage("Harga contoh belum dapat dimuat. Coba lagi.");
      })
      .finally(() => {
        if (current === requestId.current) setPending(false);
      });
  }

  function fieldError(key: string, value: string) {
    const candidate = { ...target, [key]: value };
    const checked = validateTarget(definition, candidate);
    return checked.ok ? "" : (checked.errors[key] ?? "");
  }

  async function showReview() {
    setReview(null);
    setTouched(
      Object.fromEntries(definition.fields.map((field) => [field.key, true])),
    );
    const checked = validateTarget(definition, target);
    if (!checked.ok) {
      setErrors(checked.errors);
      document.getElementById(`${sectionId}-target`)?.scrollIntoView({
        block: "start",
        behavior: reduced ? "instant" : "smooth",
      });
      return;
    }
    setErrors({});
    if (!selected || !payment || !quote || pending) {
      setMessage("Pilih nominal dan metode pembayaran dulu.");
      return;
    }
    setPending(true);
    setMessage("");
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const current = ++requestId.current;
    try {
      const response = await fetch("/api/demo/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug: selected, payment, target }),
        cache: "no-store",
        signal: controller.signal,
      });
      const result = (await response.json()) as QuoteResponse;
      if (current !== requestId.current) return;
      if (result.state === "invalid_target" && "errors" in result) {
        setErrors(result.errors ?? {});
        setMessage("Periksa kembali data akun.");
      } else if (
        result.state === "ready" &&
        "quote" in result &&
        result.maskedTarget
      ) {
        setQuote(result.quote);
        setReview({ quote: result.quote, maskedTarget: result.maskedTarget });
        requestAnimationFrame(() =>
          document.getElementById(`${sectionId}-review`)?.scrollIntoView({
            block: "start",
            behavior: reduced ? "instant" : "smooth",
          }),
        );
      } else setMessage("Pratinjau belum dapat dibuat. Coba lagi nanti.");
    } catch {
      if (!controller.signal.aborted && current === requestId.current)
        setMessage(
          "Pratinjau belum dapat dibuat. Periksa koneksi lalu coba lagi.",
        );
    } finally {
      if (current === requestId.current) setPending(false);
    }
  }

  async function createOrder() {
    if (!review || !selected || !payment) return;
    if (pending) return;
    setPending(true);
    setMessage("");

    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch("/api/checkout/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: selected,
          paymentMethod: payment,
          target,
          quoteToken: review.quote.quoteToken,
          idempotencyKey,
        }),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.error === "price_changed") {
          setMessage(
            "Harga berubah sejak terakhir diperiksa. Silakan tinjau ulang.",
          );
          loadQuote(selected, payment);
        } else if (result.error === "invalid_request") {
          setErrors(result.errors ?? {});
          setMessage("Periksa kembali data akun.");
        } else if (result.error === "product_unavailable") {
          setMessage("Produk ini sementara tidak tersedia.");
        } else if (result.error === "quote_expired") {
          setMessage("Sesi pratinjau kedaluwarsa. Silakan periksa kembali.");
          loadQuote(selected, payment);
        } else {
          setMessage("Gagal membuat pesanan. Coba lagi.");
        }
        setPending(false);
        return;
      }
      // Successful creation
      router.push(`/orders/${result.publicReference}`);
    } catch {
      setMessage("Koneksi terputus. Coba lagi.");
      setPending(false);
    }
  }

  return (
    <div className="prep-layout">
      <div className="prep-main">
        <section
          id={`${sectionId}-target`}
          className="prep-section"
          aria-labelledby={`${sectionId}-target-title`}
        >
          <div className="prep-step">
            <span>01</span>
            <div>
              <p>Data akun</p>
              <h2 id={`${sectionId}-target-title`}>Masukkan tujuan</h2>
            </div>
          </div>
          <p className="prep-instruction">
            {category === "game"
              ? `Masukkan data akun ${name} tujuan.`
              : "Masukkan data tujuan untuk produk ini."}{" "}
            TOPUPLAB tidak meminta password akun.
          </p>
          <div className="prep-fields">
            {definition.fields.map((field) => {
              const id = `${sectionId}-${field.key}`;
              const error = touched[field.key] ? errors[field.key] : "";
              return (
                <div className="prep-field" key={field.key}>
                  <label htmlFor={id}>{field.label}</label>
                  <input
                    id={id}
                    value={target[field.key] ?? ""}
                    type={field.format === "PHONE_E164" ? "tel" : "text"}
                    inputMode={
                      field.format === "TEXT"
                        ? "text"
                        : field.format === "DIGITS"
                          ? "numeric"
                          : "tel"
                    }
                    autoComplete="off"
                    disabled={pending}
                    maxLength={field.maxLength + 4}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    onChange={(event) => {
                      const value = event.target.value;
                      setTarget((current) => ({
                        ...current,
                        [field.key]: value,
                      }));
                      setReview(null);
                      if (touched[field.key])
                        setErrors((current) => ({
                          ...current,
                          [field.key]: fieldError(field.key, value),
                        }));
                    }}
                    onBlur={() => {
                      setTouched((current) => ({
                        ...current,
                        [field.key]: true,
                      }));
                      setErrors((current) => ({
                        ...current,
                        [field.key]: fieldError(
                          field.key,
                          target[field.key] ?? "",
                        ),
                      }));
                    }}
                  />
                  {error && (
                    <p className="prep-field-error" id={`${id}-error`}>
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section
          className="prep-section game-denominations"
          aria-labelledby={`${sectionId}-denominations`}
        >
          <div className="prep-step">
            <span>02</span>
            <div>
              <p>Nominal</p>
              <h2 id={`${sectionId}-denominations`}>Pilih nominal</h2>
            </div>
          </div>
          <ul className="prep-options">
            {products.map((item) => (
              <li key={item.productSlug}>
                <DenominationOption
                  name={`${sectionId}-denomination`}
                  value={item.productSlug}
                  label={item.denomination}
                  price={
                    item.available
                      ? formatIdr(item.priceIdr)
                      : "Sementara tidak tersedia"
                  }
                  selected={selected === item.productSlug}
                  disabled={
                    !item.available || item.priceIdr === null || pending
                  }
                  onSelect={() => {
                    setSelected(item.productSlug);
                    loadQuote(item.productSlug, payment ?? "QRIS");
                  }}
                />
              </li>
            ))}
          </ul>
          <p className="prep-footnote">
            Harga di atas adalah pratinjau demo. Harga diperiksa ulang saat
            ringkasan dibuat.
          </p>
        </section>

        <section
          className="prep-section"
          aria-labelledby={`${sectionId}-payment`}
        >
          <div className="prep-step">
            <span>03</span>
            <div>
              <p>Pembayaran</p>
              <h2 id={`${sectionId}-payment`}>Pilih metode</h2>
            </div>
          </div>
          <div className="prep-payments">
            {paymentOptions.map((option) => (
              <PaymentMethodRow
                key={option.code}
                name={`${sectionId}-payment-method`}
                label={option.label}
                description={option.description}
                checked={payment === option.code}
                onSelect={() => {
                  setPayment(option.code);
                  if (selected) loadQuote(selected, option.code);
                }}
                disabled={!selected || pending}
              />
            ))}
          </div>
          <p className="prep-footnote">
            Pilihan ini hanya untuk pratinjau. Belum terhubung ke layanan
            pembayaran.
          </p>
        </section>

        <section
          id={`${sectionId}-review`}
          className="prep-section"
          aria-labelledby={`${sectionId}-review-title`}
        >
          <div className="prep-step">
            <span>04</span>
            <div>
              <p>Konfirmasi</p>
              <h2 id={`${sectionId}-review-title`}>Periksa ringkasan</h2>
            </div>
          </div>
          {message && (
            <p className="prep-error" role="alert">
              <CircleAlert size={18} aria-hidden="true" />
              {message}
            </p>
          )}
          {review ? (
            <motion.div
              className="prep-review"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : transition}
            >
              <dl>
                <div>
                  <dt>Produk</dt>
                  <dd>{review.quote.productName}</dd>
                </div>
                {review.maskedTarget.map((field) => (
                  <div key={field.label}>
                    <dt>{field.label}</dt>
                    <dd>{field.value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Metode contoh</dt>
                  <dd>
                    {
                      paymentOptions.find(
                        (item) => item.code === review.quote.payment,
                      )?.label
                    }
                  </dd>
                </div>
              </dl>
              <PriceBreakdown
                lines={[
                  {
                    label: "Harga produk",
                    value: formatIdr(review.quote.priceIdr),
                  },
                  {
                    label: "Biaya pembayaran",
                    value: formatIdr(review.quote.feeIdr),
                  },
                ]}
                total={formatIdr(review.quote.totalIdr)}
              />
              <p className="prep-boundary">
                Dengan membuat pesanan, Anda menyetujui total harga di atas.
              </p>
            </motion.div>
          ) : (
            <p className="prep-footnote">
              Isi data akun, pilih nominal dan metode, lalu periksa
              ringkasannya. Belum ada pesanan yang dibuat.
            </p>
          )}
          {review ? (
            <button
              type="button"
              className="prep-review-button"
              onClick={createOrder}
              disabled={pending}
            >
              {pending ? "Membuat pesanan…" : "Buat pesanan"}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="prep-review-button"
              onClick={showReview}
              disabled={pending || !selected || !payment || !quote}
            >
              {pending ? "Memeriksa harga…" : "Pratinjau pesanan"}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          )}
        </section>
      </div>
      <aside className="prep-summary" aria-label="Ringkasan harga contoh">
        <p className="catalog-kicker">Ringkasan pesanan</p>
        <h2>
          {selected
            ? products.find((item) => item.productSlug === selected)
                ?.denomination
            : "Pilih nominal"}
        </h2>

        {pending ? (
          <p role="status" className="prep-loading">
            Memeriksa harga contoh…
          </p>
        ) : quote ? (
          <PriceBreakdown
            lines={[
              {
                label: "Harga produk contoh",
                value: formatIdr(quote.priceIdr),
              },
              {
                label: "Biaya pembayaran contoh",
                value: formatIdr(quote.feeIdr),
              },
            ]}
            total={formatIdr(quote.totalIdr)}
          />
        ) : (
          <p className="prep-footnote">
            Total akan muncul setelah nominal dipilih.
          </p>
        )}
        <p className="prep-footnote">Belum ada pembayaran atau pesanan.</p>
      </aside>
      <div className="prep-mobile-bar">
        <SmartCheckoutBar
          total={pending ? "Memeriksa…" : formatIdr(quote?.totalIdr ?? null)}
          disabled={pending || !selected || !payment || !quote}
          onAction={showReview}
        />
      </div>
    </div>
  );
}
