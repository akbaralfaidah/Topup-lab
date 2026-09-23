"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useMotionPolicy } from "@/lib/motion/use-motion-policy";
import { distance } from "@/lib/motion/tokens";
import { Button } from "@/components/ui/actions";
import { StatusBadge } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import {
  DenominationOption,
  PaymentMethodRow,
  PriceBreakdown,
  ProductCard,
  ProviderHealthIndicator,
  QuickSearchHero,
  SmartCheckoutBar,
  TierPriceCell,
  TransactionTimeline,
} from "@/components/commerce/foundations";
import { LabSection } from "./foundations";

export function CommerceExamples() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [denomination, setDenomination] = useState("20");
  const [payment, setPayment] = useState("bank");
  const toast = useToast();
  const match = !query || "kredit demo".includes(query.toLowerCase());
  return (
    <LabSection
      id="commerce"
      title="Bahasa visual commerce"
      description="Spesimen terpisah dengan nilai statis. Tidak terhubung ke katalog, harga, pesanan, pembayaran, atau provider."
    >
      <QuickSearchHero
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setSearched(false);
        }}
        onSearch={() => setSearched(true)}
      >
        {searched && (
          <p role="status" className="lab-note">
            {match
              ? "Contoh ditemukan: Kredit demo."
              : "Tidak ada contoh yang cocok. Coba “kredit demo”."}
          </p>
        )}
      </QuickSearchHero>
      <div className="lab-commerce-grid">
        <div>
          <h3>ProductCard</h3>
          <ProductCard
            name="Kredit demo"
            category="Spesimen visual, bukan produk dijual"
            onSelect={() =>
              toast("Kartu produk contoh dipilih. Tidak ada pembelian.")
            }
          />
        </div>
        <div>
          <h3>DenominationOption</h3>
          <fieldset className="lab-fieldset lab-stack">
            <legend>Pilih nominal contoh</legend>
            {["10", "20"].map((value) => (
              <DenominationOption
                key={value}
                name="demo-denomination"
                value={value}
                label={`${value} kredit demo`}
                price={`Rp${value}.000`}
                selected={denomination === value}
                onSelect={() => setDenomination(value)}
              />
            ))}
            <DenominationOption
              name="demo-denomination"
              value="50"
              label="50 kredit demo · tidak tersedia"
              price="Rp50.000"
              selected={false}
              disabled
              onSelect={() => {}}
            />
          </fieldset>
        </div>
      </div>
      <div className="lab-split">
        <div className="lab-stack">
          <h3>PaymentMethodRow</h3>
          <fieldset className="lab-fieldset lab-stack">
            <legend>Metode contoh</legend>
            <PaymentMethodRow
              name="demo-payment"
              label="Transfer contoh"
              description="Biaya contoh Rp500"
              checked={payment === "bank"}
              onSelect={() => setPayment("bank")}
            />
            <PaymentMethodRow
              name="demo-payment"
              label="Metode demo lain"
              description="Hanya untuk membandingkan keadaan terpilih"
              checked={payment === "other"}
              onSelect={() => setPayment("other")}
            />
          </fieldset>
        </div>
        <div className="lab-stack">
          <h3>PriceBreakdown</h3>
          <p className="lab-note">
            Contoh nilai tetap, terpisah dari pilihan di sebelah.
          </p>
          <PriceBreakdown
            lines={[
              { label: "Harga contoh", value: "Rp20.000" },
              { label: "Biaya contoh", value: "Rp500" },
            ]}
            total="Rp20.500"
          />
          <SmartCheckoutBar
            total="Rp20.500"
            onAction={() =>
              toast("Ringkasan contoh ditinjau. Tidak ada pesanan dibuat.")
            }
          />
        </div>
      </div>
      <div className="lab-split">
        <div className="lab-stack">
          <h3>TierPriceCell</h3>
          <div className="lab-row">
            <TierPriceCell tier="Publik · contoh" price="Rp20.000" />
            <TierPriceCell tier="Member · contoh" price="Rp19.500" selected />
          </div>
        </div>
        <div>
          <h3>ProviderHealthIndicator</h3>
          <ProviderHealthIndicator
            label="Provider contoh A"
            status="Normal · demo"
            tone="success"
          />
          <ProviderHealthIndicator
            label="Provider contoh B"
            status="Terganggu · demo"
            tone="warning"
          />
          <ProviderHealthIndicator
            label="Provider contoh C"
            status="Dijeda · demo"
            tone="neutral"
          />
        </div>
      </div>
    </LabSection>
  );
}
export function MotionExamples() {
  const [complete, setComplete] = useState(false);
  const { reduced, transition } = useMotionPolicy();
  return (
    <LabSection
      id="motion"
      title="Gerak yang menjelaskan."
      description="Interaksi singkat, tanpa menunda informasi. Mengurangi gerakan membuat perubahan langsung terlihat."
    >
      <div className="lab-split">
        <div className="lab-stack">
          <p>110ms · 160ms · 220ms · 300ms</p>
          <p className="lab-note">
            Perpindahan 4 / 8 / 12 / 24px. Warna hover memakai CSS; overlay dan
            perubahan status memakai Motion.
          </p>
          <Button variant="secondary" onClick={() => setComplete(!complete)}>
            {complete ? "Ulangi status demo" : "Selesaikan status demo"}
          </Button>
          <div aria-live="polite">
            <motion.div
              key={String(complete)}
              data-testid="motion-status"
              initial={{
                opacity: reduced ? 1 : 0,
                y: reduced ? 0 : distance.small,
              }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition}
            >
              <StatusBadge tone={complete ? "success" : "info"}>
                {complete ? "Selesai · demonstrasi" : "Diproses · demonstrasi"}
              </StatusBadge>
            </motion.div>
          </div>
        </div>
        <TransactionTimeline
          steps={[
            {
              title: "Contoh disiapkan",
              detail: "Keadaan awal spesimen.",
              state: "complete",
            },
            {
              title: "Meninjau tampilan",
              detail: "Perubahan ini hanya terjadi di Design Lab.",
              state: complete ? "complete" : "current",
            },
            {
              title: "Peninjauan selesai",
              detail: complete
                ? "Contoh selesai. Tidak ada transaksi nyata."
                : "Belum selesai pada contoh ini.",
              state: complete ? "current" : "upcoming",
            },
          ]}
        />
      </div>
    </LabSection>
  );
}
