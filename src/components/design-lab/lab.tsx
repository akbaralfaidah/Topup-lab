"use client";

import NextLink from "next/link";
import { Brand } from "@/components/brand";
import { ToastProvider } from "@/components/ui/toast";
import { Foundations, ResponsiveFoundations } from "./foundations";
import {
  ControlExamples,
  DataExamples,
  FeedbackExamples,
  FormExamples,
  NavigationExamples,
  SurfaceExamples,
} from "./control-examples";
import { CommerceExamples, MotionExamples } from "./commerce-examples";

const sections = [
  ["foundations", "Fondasi"],
  ["typography", "Tipografi"],
  ["colors", "Warna"],
  ["controls", "Kontrol"],
  ["forms", "Formulir"],
  ["feedback", "Umpan balik"],
  ["surfaces", "Permukaan"],
  ["navigation", "Navigasi"],
  ["data", "Tampilan data"],
  ["commerce", "Commerce"],
  ["motion", "Motion"],
  ["responsive", "Responsif"],
];

export function DesignLab() {
  return (
    <ToastProvider>
      <div className="design-lab">
        <a className="skip-link" href="#lab-main">
          Lewati ke konten
        </a>
        <header className="lab-header">
          <NextLink
            href="/"
            aria-label="TOPUPLAB, beranda"
            className="brand-home"
          >
            <Brand />
          </NextLink>
          <span>
            Design Lab <span className="lab-version">v0.2</span>
          </span>
        </header>
        <div className="lab-heading">
          <div>
            <p className="lab-eyebrow">Brand & sistem antarmuka</p>
            <h1>
              Satu bahasa.
              <br />
              Setiap interaksi.
            </h1>
          </div>
          <div className="lab-intro">
            <strong>Khusus pengembangan / demo</strong>
            <p>
              Tempat menguji identitas, komponen, dan gerak TOPUPLAB. Semua data
              di halaman ini adalah contoh statis.
            </p>
          </div>
        </div>
        <div className="lab-layout">
          <nav className="lab-navigation" aria-label="Bagian Design Lab">
            {sections.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
          <main id="lab-main" tabIndex={-1}>
            <Foundations />
            <ControlExamples />
            <FormExamples />
            <FeedbackExamples />
            <SurfaceExamples />
            <NavigationExamples />
            <DataExamples />
            <CommerceExamples />
            <MotionExamples />
            <ResponsiveFoundations />
          </main>
        </div>
        <footer className="lab-footer">
          <Brand monochrome />
          <p>Fondasi visual. Tidak ada transaksi nyata.</p>
          <NextLink href="/" className="ui-link">
            Kembali ke beranda
          </NextLink>
        </footer>
      </div>
    </ToastProvider>
  );
}
