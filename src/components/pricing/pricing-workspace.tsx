"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, ArrowUpRight, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useMotionPolicy } from "@/lib/motion/use-motion-policy";
import type { WorkspaceView } from "@/server/pricing/workspace";
import type { RuleInput } from "@/server/pricing/rule-input";

type Props = { data: WorkspaceView; issues: string[]; endpoint?: string };
type Simulation = {
  simulation: {
    productName: string;
    tierName: string;
    referenceTime: string;
    candidates: Candidate[];
    chosen: Candidate | null;
  };
  tiers: {
    tierId: string;
    tierName: string;
    priceIdr: string | null;
    issue: string | null;
  }[];
};
type Candidate = {
  skuId: string;
  providerName: string;
  costIdr: string;
  eligible: boolean;
  priority: number;
  freshness: string;
  issue: string | null;
  price: null | {
    sellingPriceIdr: string;
    expectedMarginIdr: string;
    commercialRuleName: string;
    appliedScope: string;
    commercialPercentageIdr: string;
    commercialMarkupIdr: string;
    providerFloorIdr: string | null;
  };
};
type Impact = {
  affectedCount: number;
  productName: string | null;
  before: Candidate | null;
  after: Candidate | null;
  tierImpact: {
    tierName: string;
    before: string | null;
    after: string | null;
  }[];
};

const scopeNames = {
  GLOBAL: "Global",
  CATEGORY: "Kategori",
  BRAND: "Merek",
  PRODUCT: "Produk",
  PROVIDER: "Penyedia",
};
function idr(value: string | null | undefined) {
  return value == null
    ? "—"
    : `Rp${value.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}
function percentage(bps: number) {
  const whole = Math.floor(bps / 100);
  const fractional = String(bps % 100)
    .padStart(2, "0")
    .replace(/0+$/, "");
  return fractional ? `${whole}.${fractional}` : String(whole);
}
function toWibInput(iso: string | null) {
  return iso
    ? new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16)
    : "";
}
function fromWibInput(value: string) {
  return value ? new Date(`${value}:00+07:00`).toISOString() : null;
}
function fromRule(rule: WorkspaceView["rules"][number]): RuleInput {
  return {
    id: rule.id,
    version: rule.version,
    name: rule.name,
    scope: rule.scope,
    targetId:
      rule.categoryId ?? rule.brandId ?? rule.productId ?? rule.providerId,
    tierId: rule.tierId,
    fixedMarkupIdr: rule.fixedMarkupIdr,
    percentage: percentage(rule.markupBps),
    minimumMarginIdr: rule.minimumMarginIdr,
    priority: rule.priority,
    startsAt: rule.startsAt,
    endsAt: rule.endsAt,
    active: rule.active,
  };
}
const blank: RuleInput = {
  id: null,
  version: null,
  name: "",
  scope: "GLOBAL",
  targetId: null,
  tierId: null,
  fixedMarkupIdr: "0",
  percentage: "0",
  minimumMarginIdr: "0",
  priority: 100,
  startsAt: null,
  endsAt: null,
  active: false,
};

async function action(body: object, endpoint: string) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.state ?? "unavailable");
  return result;
}

export function PricingWorkspace({
  data,
  issues,
  endpoint = "/api/dev/pricing",
}: Props) {
  const router = useRouter();
  const { reduced, transition } = useMotionPolicy();
  const [draft, setDraft] = useState<RuleInput>(blank);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewStamp, setPreviewStamp] = useState("");
  const [impact, setImpact] = useState<Impact | null>(null);
  const [productId, setProductId] = useState(
    data.products.find((product) =>
      data.skus.some(
        (sku) =>
          sku.productId === product.id &&
          sku.enabled &&
          sku.available &&
          sku.stockState !== "OUT_OF_STOCK" &&
          data.providers.some(
            (provider) =>
              provider.id === sku.providerId &&
              provider.enabled &&
              ["HEALTHY", "DEGRADED"].includes(provider.state),
          ),
      ),
    )?.id ??
      data.products[0]?.id ??
      "",
  );
  const [tierId, setTierId] = useState(
    data.tiers.find((tier) => tier.code === "PUBLIC")?.id ?? "",
  );
  const [referenceTime, setReferenceTime] = useState("");
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const targetOptions =
    draft.scope === "CATEGORY"
      ? data.categories
      : draft.scope === "BRAND"
        ? data.brands
        : draft.scope === "PRODUCT"
          ? data.products
          : draft.scope === "PROVIDER"
            ? data.providers
            : [];
  const activeRules = data.rules.filter((rule) => rule.active).length;

  function edit(patch: Partial<RuleInput>) {
    setDraft((current) => ({ ...current, ...patch }));
    setImpact(null);
    setMessage("");
  }
  function selectRule(id: string | null) {
    setSelectedId(id);
    setDraft(id ? fromRule(data.rules.find((rule) => rule.id === id)!) : blank);
    setPreviewStamp("");
    setImpact(null);
    setMessage("");
  }
  async function runSimulation() {
    setBusy(true);
    setMessage("");
    try {
      const result = await action(
        {
          action: "simulate",
          productId,
          tierId,
          ...(referenceTime
            ? { referenceTime: fromWibInput(referenceTime) }
            : {}),
        },
        endpoint,
      );
      setSimulation({ simulation: result.simulation, tiers: result.tiers });
    } catch {
      setMessage(
        "Simulasi belum dapat dihitung. Periksa pilihan dan coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function previewChange() {
    setBusy(true);
    setMessage("");
    setImpact(null);
    try {
      const result = await action(
        {
          action: "preview",
          rule: draft,
          productId,
        },
        endpoint,
      );
      setImpact(result.preview);
      setPreviewStamp(JSON.stringify(draft));
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setMessage(
        code === "conflict"
          ? "Aturan aktif dengan target, tier, prioritas, dan waktu yang sama sudah ada."
          : "Aturan belum valid. Periksa target, angka, dan jadwal.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (previewStamp !== JSON.stringify(draft)) return;
    setBusy(true);
    setMessage("");
    try {
      await action({ action: "save", rule: draft }, endpoint);
      router.refresh();
      window.location.reload();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setMessage(
        code === "stale"
          ? "Aturan berubah sejak dibuka. Muat ulang sebelum menyimpan."
          : code === "conflict"
            ? "Aturan ini bertabrakan dengan aturan aktif lain."
            : "Perubahan belum tersimpan. Periksa aturan lalu coba lagi.",
      );
      setPreviewStamp("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="pricing-shell" id="main">
      <header className="pricing-header">
        <div>
          <p className="pricing-eyebrow">TOPUPLAB / RUANG KERJA DEMO</p>
          <h1>Aturan harga</h1>
          <p>
            Atur margin dan periksa dampaknya sebelum menyimpan. Data ini hanya
            berlaku pada database demo lokal.
          </p>
        </div>
        <a href="/dev/design-system" className="pricing-header-link">
          Design Lab <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </header>
      <div className="pricing-facts" aria-label="Ringkasan konfigurasi">
        <p>
          <strong>{activeRules}</strong>
          <span>aturan aktif</span>
        </p>
        <p>
          <strong>
            {
              new Set(
                data.rules
                  .filter((rule) => rule.active)
                  .map((rule) => rule.scope),
              ).size
            }
          </strong>
          <span>lingkup terpakai</span>
        </p>
        <p>
          <strong>{issues.length}</strong>
          <span>temuan konfigurasi</span>
        </p>
      </div>
      {issues.length > 0 && (
        <section
          className="pricing-issues"
          aria-labelledby="pricing-issues-title"
        >
          <h2 id="pricing-issues-title">
            <CircleAlert size={19} aria-hidden="true" /> Perlu diperiksa
          </h2>
          <ul>
            {issues.slice(0, 5).map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
          {issues.length > 5 && <p>{issues.length - 5} temuan lain.</p>}
        </section>
      )}
      <div className="pricing-workspace-grid">
        <section
          className="pricing-rule-list"
          aria-labelledby="pricing-list-title"
        >
          <div className="pricing-section-heading">
            <div>
              <p className="pricing-eyebrow">01 / INVENTARIS</p>
              <h2 id="pricing-list-title">Daftar aturan</h2>
            </div>
            <button type="button" onClick={() => selectRule(null)}>
              Aturan baru
            </button>
          </div>
          <p className="pricing-section-note">
            Pilih aturan untuk mengubahnya. Menonaktifkan lebih aman daripada
            menghapus.
          </p>
          <div className="pricing-rule-items">
            {data.rules.map((rule) => {
              const target =
                rule.scope === "CATEGORY"
                  ? data.categories.find((item) => item.id === rule.categoryId)
                      ?.name
                  : rule.scope === "BRAND"
                    ? data.brands.find((item) => item.id === rule.brandId)?.name
                    : rule.scope === "PRODUCT"
                      ? data.products.find((item) => item.id === rule.productId)
                          ?.name
                      : rule.scope === "PROVIDER"
                        ? data.providers.find(
                            (item) => item.id === rule.providerId,
                          )?.name
                        : "Semua produk";
              return (
                <button
                  type="button"
                  key={rule.id}
                  className="pricing-rule-item"
                  aria-pressed={selectedId === rule.id}
                  onClick={() => selectRule(rule.id)}
                >
                  <span className="pricing-rule-top">
                    <strong>{rule.name}</strong>
                    <span
                      className={
                        rule.active ? "pricing-state active" : "pricing-state"
                      }
                    >
                      {rule.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </span>
                  <span>
                    {scopeNames[rule.scope]} · {target} ·{" "}
                    {data.tiers.find((tier) => tier.id === rule.tierId)?.name ??
                      "Semua tier"}
                  </span>
                  <span className="pricing-rule-numbers">
                    <b>
                      {idr(rule.fixedMarkupIdr)} + {percentage(rule.markupBps)}%
                    </b>
                    <small>
                      min. {idr(rule.minimumMarginIdr)} · prioritas{" "}
                      {rule.priority}
                    </small>
                  </span>
                  {(rule.startsAt || rule.endsAt) && (
                    <span className="pricing-rule-schedule">
                      {rule.startsAt
                        ? new Date(rule.startsAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Asia/Jakarta",
                          })
                        : "Tanpa awal"}{" "}
                      –{" "}
                      {rule.endsAt
                        ? new Date(rule.endsAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Asia/Jakarta",
                          })
                        : "Tanpa akhir"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
        <section
          className="pricing-builder"
          aria-labelledby="pricing-builder-title"
        >
          <div className="pricing-section-heading">
            <div>
              <p className="pricing-eyebrow">02 / KONFIGURASI</p>
              <h2 id="pricing-builder-title">
                {selectedId ? "Ubah aturan" : "Buat aturan"}
              </h2>
            </div>
          </div>
          <p className="pricing-section-note">
            Angka rupiah tanpa pemisah. Persen menerima paling banyak dua angka
            desimal.
          </p>
          <div className="pricing-form-grid">
            <label className="pricing-wide">
              Nama aturan
              <input
                value={draft.name}
                maxLength={80}
                onChange={(e) => edit({ name: e.target.value })}
              />
            </label>
            <label>
              Lingkup
              <select
                value={draft.scope}
                onChange={(e) =>
                  edit({
                    scope: e.target.value as RuleInput["scope"],
                    targetId: null,
                  })
                }
              >
                {Object.entries(scopeNames).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target
              <select
                value={draft.targetId ?? ""}
                disabled={draft.scope === "GLOBAL"}
                onChange={(e) => edit({ targetId: e.target.value || null })}
              >
                <option value="">
                  {draft.scope === "GLOBAL" ? "Semua produk" : "Pilih target"}
                </option>
                {targetOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tier
              <select
                value={draft.tierId ?? ""}
                onChange={(e) => edit({ tierId: e.target.value || null })}
              >
                <option value="">Semua tier</option>
                {data.tiers
                  .filter((tier) => tier.active)
                  .map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Prioritas
              <input
                inputMode="numeric"
                value={draft.priority}
                onChange={(e) => edit({ priority: Number(e.target.value) })}
              />
            </label>
            <label>
              Markup tetap (Rp)
              <input
                inputMode="numeric"
                value={draft.fixedMarkupIdr}
                onChange={(e) => edit({ fixedMarkupIdr: e.target.value })}
              />
            </label>
            <label>
              Markup persentase (%)
              <input
                inputMode="decimal"
                value={draft.percentage}
                onChange={(e) => edit({ percentage: e.target.value })}
              />
            </label>
            <label>
              Margin minimum (Rp)
              <input
                inputMode="numeric"
                value={draft.minimumMarginIdr}
                onChange={(e) => edit({ minimumMarginIdr: e.target.value })}
              />
            </label>
            <label>
              Mulai WIB (opsional)
              <input
                type="datetime-local"
                value={toWibInput(draft.startsAt)}
                onChange={(e) =>
                  edit({
                    startsAt: fromWibInput(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Akhir WIB (opsional)
              <input
                type="datetime-local"
                value={toWibInput(draft.endsAt)}
                onChange={(e) =>
                  edit({
                    endsAt: fromWibInput(e.target.value),
                  })
                }
              />
            </label>
            <label className="pricing-toggle">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => edit({ active: e.target.checked })}
              />
              <span>Aturan aktif</span>
            </label>
          </div>
          <div className="pricing-actions">
            <button type="button" onClick={previewChange} disabled={busy}>
              {busy ? "Memeriksa…" : "Pratinjau dampak"}
            </button>
            <button
              type="button"
              className="pricing-primary"
              onClick={save}
              disabled={
                busy || !impact || previewStamp !== JSON.stringify(draft)
              }
            >
              Simpan aturan
            </button>
          </div>
          {message && (
            <p className="pricing-message" role="alert">
              {message}
            </p>
          )}
          {impact && (
            <div className="pricing-impact" role="status">
              <h3>Dampak sebelum simpan</h3>
              <p>
                {impact.affectedCount} produk dalam lingkup aturan. Contoh:{" "}
                {impact.productName ?? "belum ada produk"}.
              </p>
              {!draft.active && (
                <p>Aturan nonaktif; harga contoh tidak berubah.</p>
              )}
              <div className="pricing-impact-prices">
                <span>
                  Sebelum{" "}
                  <strong>{idr(impact.before?.price?.sellingPriceIdr)}</strong>
                </span>
                <span>
                  Sesudah{" "}
                  <strong>{idr(impact.after?.price?.sellingPriceIdr)}</strong>
                </span>
              </div>
              <ul>
                {impact.tierImpact.map((item) => (
                  <li key={item.tierName}>
                    {item.tierName}: {idr(item.before)} → {idr(item.after)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
      <section
        className="pricing-simulator"
        aria-labelledby="pricing-sim-title"
      >
        <div className="pricing-section-heading">
          <div>
            <p className="pricing-eyebrow">03 / SIMULASI</p>
            <h2 id="pricing-sim-title">Berapa harga yang dibayar?</h2>
          </div>
          <p>Referensi demo: 24 Sep 2026, 12.00 WIB</p>
        </div>
        <div className="pricing-sim-controls">
          <label>
            Produk
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setSimulation(null);
              }}
            >
              {data.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tier
            <select
              value={tierId}
              onChange={(e) => {
                setTierId(e.target.value);
                setSimulation(null);
              }}
            >
              {data.tiers
                .filter((tier) => tier.active)
                .map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Waktu referensi WIB (opsional)
            <input
              type="datetime-local"
              value={referenceTime}
              onChange={(e) => {
                setReferenceTime(e.target.value);
                setSimulation(null);
              }}
            />
          </label>
          <button
            type="button"
            onClick={runSimulation}
            disabled={busy || !productId || !tierId}
          >
            <RefreshCw size={16} aria-hidden="true" /> Hitung harga
          </button>
        </div>
        {simulation && (
          <motion.div
            className="pricing-sim-results"
            initial={false}
            animate={{ opacity: 1 }}
            transition={reduced ? { duration: 0 } : transition}
          >
            <div className="pricing-final">
              <p>
                {simulation.simulation.productName} ·{" "}
                {simulation.simulation.tierName}
              </p>
              <strong>
                {idr(simulation.simulation.chosen?.price?.sellingPriceIdr)}
              </strong>
              <span>
                {simulation.simulation.chosen?.issue ??
                  "Harga jual sebelum biaya pembayaran contoh."}
              </span>
            </div>
            <div className="pricing-trace">
              <h3>Jejak perhitungan</h3>
              {simulation.simulation.chosen?.price ? (
                <dl>
                  <div>
                    <dt>Aturan terpilih</dt>
                    <dd>
                      {simulation.simulation.chosen.price.commercialRuleName} (
                      {
                        scopeNames[
                          simulation.simulation.chosen.price
                            .appliedScope as keyof typeof scopeNames
                        ]
                      }
                      )
                    </dd>
                  </div>
                  <div>
                    <dt>Biaya penyedia</dt>
                    <dd>{idr(simulation.simulation.chosen.costIdr)}</dd>
                  </div>
                  <div>
                    <dt>Markup persentase</dt>
                    <dd>
                      {idr(
                        simulation.simulation.chosen.price
                          .commercialPercentageIdr,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Markup sesudah margin minimum</dt>
                    <dd>
                      {idr(
                        simulation.simulation.chosen.price.commercialMarkupIdr,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Batas bawah penyedia</dt>
                    <dd>
                      {idr(simulation.simulation.chosen.price.providerFloorIdr)}
                    </dd>
                  </div>
                  <div>
                    <dt>Margin harapan</dt>
                    <dd>
                      {idr(
                        simulation.simulation.chosen.price.expectedMarginIdr,
                      )}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p>Belum ada harga yang dapat dihitung untuk pilihan ini.</p>
              )}
            </div>
            <div className="pricing-comparisons">
              <div>
                <h3>Bandingkan tier</h3>
                <ul>
                  {simulation.tiers.map((item) => (
                    <li key={item.tierId}>
                      <span>{item.tierName}</span>
                      <strong>{idr(item.priceIdr)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Kandidat penyedia demo</h3>
                <ul>
                  {simulation.simulation.candidates.map((item) => (
                    <li key={item.skuId}>
                      <span>
                        {item.providerName}
                        <small>
                          {item.eligible
                            ? `Biaya ${idr(item.costIdr)} · margin ${idr(item.price?.expectedMarginIdr)} · sinkronisasi ${item.freshness === "unknown" ? "tidak diketahui" : item.freshness === "stale" ? "lama" : item.freshness === "future" ? "setelah waktu referensi" : "baru"}`
                            : "Tidak tersedia"}
                        </small>
                      </span>
                      <strong>{idr(item.price?.sellingPriceIdr)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </section>
      <p className="pricing-boundary">
        Ruang kerja ini hanya untuk database demo lokal. Tidak ada pesanan,
        pembayaran, atau perubahan penyedia.
      </p>
    </main>
  );
}
