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
  const product = catalog.products.find(
    (item) => item.slug === slug && item.categorySlug !== "game",
  );
  return {
    title: product ? `${product.name} — Pratinjau harga` : "Pilihan produk",
    description: product
      ? `Periksa data tujuan dan harga contoh ${product.name} di TOPUPLAB. Transaksi belum tersedia.`
      : "Katalog TOPUPLAB belum tersedia.",
    alternates: {
      canonical: product ? `/products/${product.slug}` : "/products",
    },
    robots: { index: false, follow: false },
  };
}

export default async function ProductPreparationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getPublicCatalog();
  if (catalog.state === "unavailable")
    return (
      <div className="catalog-page">
        <section className="catalog-unavailable" role="status">
          <h1>Katalog belum tersedia.</h1>
          <p>
            Data demo sedang tidak dapat diakses, atau mode demo tidak aktif.
          </p>
          <Link href="/products">
            Kembali ke katalog <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </div>
    );
  const product = catalog.products.find(
    (item) => item.slug === slug && item.categorySlug !== "game",
  );
  if (!product) notFound();
  const preview = await readDemoPreviews([product.slug], "QRIS");
  return (
    <div className="catalog-page prep-page">
      <nav className="catalog-breadcrumb" aria-label="Jejak halaman">
        <Link href="/">Beranda</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/products?category=${product.categorySlug}`}>
          {product.categoryName}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{product.name}</span>
      </nav>
      <header className="prep-page-heading">
        <div>
          <p className="catalog-kicker">
            {product.categoryName} / Pratinjau transaksi
          </p>
          <h1>{product.name}</h1>
          <p>
            Masukkan data tujuan dan periksa harga contoh. Belum ada transaksi
            atau pembayaran yang dibuat.
          </p>
          <Link href={`/products?category=${product.categorySlug}`}>
            <ArrowLeft size={17} aria-hidden="true" /> Kembali ke kategori
          </Link>
        </div>
      </header>
      {preview.state === "ready" && preview.products[0] ? (
        <PreparationForm
          name={product.name}
          category={product.categorySlug}
          products={preview.products.map((item) => item.quote)}
          definition={preview.products[0].inputDefinition}
        />
      ) : (
        <section className="catalog-unavailable" role="status">
          <h2>Pratinjau harga belum tersedia.</h2>
          <p>Data demo sedang tidak dapat diperiksa. Coba lagi nanti.</p>
          <Link href="/products">
            Lihat produk lain <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  );
}
