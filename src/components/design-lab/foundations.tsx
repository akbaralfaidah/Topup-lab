import { Brand, BrandMark } from "@/components/brand";
import { ResponsiveGrid } from "@/components/ui/data";
import type { CSSProperties, ReactNode } from "react";

export function LabSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="lab-section" aria-labelledby={`${id}-title`}>
      <header className="lab-section-heading">
        <h2 id={`${id}-title`}>{title}</h2>
        <p>{description}</p>
      </header>
      {children}
    </section>
  );
}
export function Foundations() {
  return (
    <>
      <LabSection
        id="foundations"
        title="Identitas yang bergerak maju."
        description="Dua segmen naik, satu alur yang jelas. Mark sederhana untuk pergerakan kredit, tanpa simbol koin atau kilat."
      >
        <div className="lab-brand-board">
          <div className="lab-brand-main">
            <Brand />
            <p>Commerce Utility × Gaming Energy</p>
          </div>
          <div className="lab-brand-mark">
            <BrandMark />
            <span>Mark kompak · minimum 16px</span>
          </div>
          <div className="lab-brand-mono">
            <Brand monochrome />
            <span>Monokrom · permukaan terang</span>
          </div>
          <div className="lab-brand-inverse">
            <Brand monochrome />
            <span>Monokrom · permukaan gelap</span>
          </div>
        </div>
        <p className="lab-note">
          Ruang bebas minimum: ¼ tinggi mark. Wordmark minimum 96px; lockup mark
          + nama minimum 132px. Jangan memiringkan, memberi glow, atau
          meregangkan logo.
        </p>
      </LabSection>
      <LabSection
        id="typography"
        title="Tipografi"
        description="Plus Jakarta Sans lokal. Satu keluarga, tiga bobot utama, angka yang mudah dibandingkan."
      >
        <div className="lab-type-specimen">
          <span className="lab-display">Jelas di setiap langkah.</span>
          <p>Aa Bb Cc · 0123456789 · Rp20.500</p>
        </div>
        <div className="lab-type-scale">
          {[
            "display",
            "h1",
            "h2",
            "h3",
            "h4",
            "body-large",
            "body",
            "small",
            "micro",
          ].map((type) => (
            <div key={type}>
              <code>{type}</code>
              <span style={{ fontSize: `var(--type-${type})` }}>
                Pilih dengan jelas
              </span>
            </div>
          ))}
        </div>
        <div className="lab-split">
          <div>
            <p className="lab-caption">Harga contoh</p>
            <span className="numeric price">Rp20.500</span>
          </div>
          <div>
            <p className="lab-caption">Angka tabular · spesimen, bukan KPI</p>
            <span className="numeric numeric-kpi">012345</span>
          </div>
          <div>
            <p className="lab-caption">Referensi contoh</p>
            <span className="transaction-number">DEMO-2026-001</span>
          </div>
        </div>
      </LabSection>
      <LabSection
        id="colors"
        title="Warna dengan fungsi."
        description="Lime menandai tindakan utama. Sukses, tertunda, gagal, dan informasi punya warna serta label sendiri."
      >
        <div className="lab-swatches">
          {[
            "brand-default",
            "surface-inverse",
            "surface-page",
            "surface-default",
            "brand-subtle",
            "brand-soft",
          ].map((token) => (
            <div key={token}>
              <div
                className="lab-swatch"
                style={{ background: `var(--${token})` }}
              />
              <code>{token}</code>
            </div>
          ))}
        </div>
        <div className="lab-color-groups">
          {Object.entries({
            Brand: [
              "subtle",
              "soft",
              "default",
              "hover",
              "active",
              "foreground",
            ],
            Surface: ["page", "default", "elevated", "subdued", "inverse"],
            Text: ["primary", "secondary", "muted", "inverse", "disabled"],
            Border: ["subtle", "default", "strong", "focus"],
          }).map(([group, values]) => (
            <div key={group}>
              <h3>{group}</h3>
              {values.map((value) => (
                <div className="lab-color-row" key={value}>
                  <span
                    style={{
                      background: `var(--${group.toLowerCase()}-${value})`,
                    }}
                  />
                  <code>{value}</code>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="lab-semantic">
          {["success", "warning", "danger", "info"].map((tone) => (
            <div key={tone} className={`tone-${tone}`}>
              <strong>{tone}</strong>
              <span>foreground · subtle · border</span>
            </div>
          ))}
        </div>
      </LabSection>
    </>
  );
}
export function ResponsiveFoundations() {
  return (
    <LabSection
      id="responsive"
      title="Ruang & responsif"
      description="Grid 4 kolom pada ponsel, 8 pada tablet, 12 pada desktop. Konten tetap menentukan susunannya."
    >
      <ResponsiveGrid>
        {Array.from({ length: 12 }, (_, index) => (
          <div className="lab-grid-cell" key={index}>
            {index + 1}
          </div>
        ))}
      </ResponsiveGrid>
      <div className="lab-spacing">
        {[1, 2, 3, 4, 6, 8, 12, 16, 24].map((space) => (
          <div key={space}>
            <code>{space * 4}px</code>
            <span style={{ width: `var(--space-${space})` } as CSSProperties} />
          </div>
        ))}
      </div>
      <dl className="lab-layout-notes">
        <div>
          <dt>Konten</dt>
          <dd>1216px</dd>
        </div>
        <div>
          <dt>Bacaan</dt>
          <dd>672px</dd>
        </div>
        <div>
          <dt>Checkout</dt>
          <dd>1024px</dd>
        </div>
        <div>
          <dt>Admin</dt>
          <dd>1440px</dd>
        </div>
      </dl>
      <p className="lab-note">
        Gutter ponsel 20px; tablet dan desktop 32px. Dialog tetap ringkas;
        drawer menjadi bottom sheet di ponsel. Tabel berubah menjadi baris
        berlabel.
      </p>
    </LabSection>
  );
}
