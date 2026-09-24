import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPublicCatalog } from "@/server/public-catalog";
import { readDemoPreviews } from "@/server/pricing/preview";
import { PreparationForm } from "@/components/checkout/preparation-form";
import "../../catalog.css";
import "../../preparation.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getPublicCatalog();
  const group = catalog.groups.find((item) => item.slug === slug);
  return {
    title: group
      ? `${group.name} — Nominal dan pratinjau harga`
      : "Pilihan game",
    description: group
      ? `Isi data tujuan, pilih nominal, dan tinjau harga contoh ${group.name} di TOPUPLAB. Transaksi belum tersedia.`
      : "Katalog game TOPUPLAB belum tersedia.",
    alternates: {
      canonical: group ? `/games/${group.slug}` : "/products?category=game",
    },
    robots: { index: false, follow: false },
  };
}

export default async function GameGroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getPublicCatalog();
  if (catalog.state === "unavailable")
    return (
      <div className="catalog-page">
        <nav className="catalog-breadcrumb" aria-label="Jejak halaman">
          <Link href="/">Beranda</Link>
          <span aria-hidden="true">/</span>
          <span>Game</span>
        </nav>
        <section className="catalog-unavailable" role="status">
          <h1>Katalog belum tersedia.</h1>
          <p>
            Data demo sedang tidak dapat diakses, atau mode demo tidak aktif.
            Coba lagi nanti.
          </p>
          <Link href="/">
            Kembali ke beranda <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </div>
    );
  const group = catalog.groups.find((item) => item.slug === slug);
  if (!group) notFound();
  const denominations = catalog.products
    .filter(
      (item) => item.groupSlug === group.slug && item.categorySlug === "game",
    )
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"),
    );
  const preview = await readDemoPreviews(
    denominations.map((item) => item.slug),
    "QRIS",
  );
  const definition =
    preview.state === "ready" ? preview.products[0]?.inputDefinition : null;
  const matchingDefinition =
    preview.state === "ready" &&
    preview.products.every(
      (item) =>
        JSON.stringify(item.inputDefinition) === JSON.stringify(definition),
    );
  return (
    <div className="catalog-page game-page">
      <nav aria-label="Jejak halaman" className="catalog-breadcrumb">
        <Link href="/">Beranda</Link>
        <span aria-hidden="true">/</span>
        <Link href="/products?category=game">Game</Link>
        <span aria-hidden="true">/</span>
        <span>{group.name}</span>
      </nav>
      <header className="game-page-heading">
        <div>
          <p className="catalog-kicker">Game / Pilihan nominal</p>
          <h1>{group.name}</h1>
          <p>
            Masukkan data tujuan, pilih nominal, lalu periksa harga contoh.
            Belum ada transaksi atau pembayaran yang dibuat.
          </p>
          <Link href="/products?category=game">
            <ArrowLeft size={17} aria-hidden="true" /> Semua game
          </Link>
        </div>
        <div className="game-page-mark" aria-hidden="true">
          <strong>
            {group.name
              .split(" ")
              .map((word) => word[0])
              .slice(0, 2)
              .join("")}
          </strong>
          <small>TOPUPLAB / GAME</small>
        </div>
      </header>
      {preview.state === "ready" && definition && matchingDefinition ? (
        <PreparationForm
          name={group.name}
          category="game"
          products={preview.products.map((item) => item.quote)}
          definition={definition}
        />
      ) : (
        <section className="catalog-unavailable" role="status">
          <h2>Pratinjau harga belum tersedia.</h2>
          <p>Data demo sedang tidak dapat diperiksa. Coba lagi nanti.</p>
          <Link href="/products?category=game">
            Lihat game lain <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  );
}
