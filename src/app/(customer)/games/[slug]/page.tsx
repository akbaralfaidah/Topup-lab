import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPublicCatalog } from "@/server/public-catalog";
import "../../catalog.css";

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
    title: group ? `${group.name} — Pilihan nominal` : "Pilihan game",
    description: group
      ? `Lihat pilihan nominal demo ${group.name} di TOPUPLAB. Halaman ini hanya untuk penelusuran; transaksi belum tersedia.`
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
            Lihat nominal yang tercatat di katalog demo. Pembelian dan pengisian
            ID pemain belum tersedia.
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
      <section
        className="game-denominations"
        aria-labelledby="denominations-title"
      >
        <div className="catalog-section-head">
          <div>
            <p className="catalog-kicker">
              {denominations.length} pilihan demo
            </p>
            <h2 id="denominations-title">Pilihan nominal</h2>
          </div>
          <span>{group.availableCount} tersedia dalam data demo</span>
        </div>
        <ul>
          {denominations.map((item, index) => (
            <li key={item.slug} id={`nominal-${item.slug}`}>
              <span className="game-denomination-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{item.denomination}</strong>
                <small>{item.name}</small>
              </div>
              <span
                className={`catalog-availability ${item.available ? "is-available" : "is-unavailable"}`}
              >
                {item.available
                  ? "Contoh tersedia"
                  : "Sementara tidak tersedia"}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <aside className="game-page-note">
        <strong>Ini halaman penelusuran.</strong>
        <p>
          Nominal dan ketersediaan di atas adalah data demo. Harga akhir, tujuan
          top up, dan transaksi akan ditangani pada fase berikutnya.
        </p>
      </aside>
    </div>
  );
}
