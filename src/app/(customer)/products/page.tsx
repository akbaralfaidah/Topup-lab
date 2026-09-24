import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { getPublicCatalog } from "@/server/public-catalog";
import {
  catalogHref,
  filterCatalog,
  parseCatalogQuery,
  type CatalogQuery,
} from "@/lib/catalog-discovery";
import "../catalog.css";

export const dynamic = "force-dynamic";
type QueryInput = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<QueryInput>;
}): Promise<Metadata> {
  const query = parseCatalogQuery(await searchParams);
  const catalog = await getPublicCatalog();
  const category = catalog.categories.find(
    (item) => item.slug === query.category,
  );
  const title = query.q
    ? `Hasil pencarian “${query.q}”`
    : category
      ? `${category.name} — Katalog produk`
      : "Katalog produk";
  return {
    title,
    description: query.q
      ? `Hasil pencarian katalog demo TOPUPLAB untuk ${query.q}. Produk ditampilkan untuk penelusuran; transaksi belum tersedia.`
      : `Jelajahi ${category ? category.name : "game dan layanan digital"} di katalog demo TOPUPLAB. Transaksi belum tersedia.`,
    alternates: {
      canonical:
        query.q || query.availability !== "all" || query.sort !== "display"
          ? "/products"
          : catalogHref({ category: query.category }),
    },
    robots: { index: false, follow: false },
  };
}

function Availability({ available }: { available: boolean }) {
  return (
    <span
      className={`catalog-availability ${available ? "is-available" : "is-unavailable"}`}
    >
      {available ? "Contoh tersedia" : "Sementara tidak tersedia"}
    </span>
  );
}

function FilterForm({ query }: { query: CatalogQuery }) {
  return (
    <form
      action="/products"
      method="get"
      className="catalog-filter-form"
      aria-label="Filter katalog"
    >
      {query.q && <input type="hidden" name="q" value={query.q} />}
      {query.category && (
        <input type="hidden" name="category" value={query.category} />
      )}
      <div>
        <label htmlFor="availability-filter">Ketersediaan</label>
        <select
          id="availability-filter"
          name="availability"
          defaultValue={query.availability}
        >
          <option value="all">Semua</option>
          <option value="available">Contoh tersedia</option>
          <option value="unavailable">Sementara tidak tersedia</option>
        </select>
      </div>
      <div>
        <label htmlFor="sort-filter">Urutkan</label>
        <select id="sort-filter" name="sort" defaultValue={query.sort}>
          <option value="display">Urutan tampilan</option>
          <option value="name">Nama A–Z</option>
        </select>
      </div>
      <button type="submit">
        <SlidersHorizontal size={17} aria-hidden="true" /> Terapkan
      </button>
    </form>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<QueryInput>;
}) {
  const query = parseCatalogQuery(await searchParams);
  const catalog = await getPublicCatalog();
  const results = filterCatalog(catalog, query);
  const selectedCategory = catalog.categories.find(
    (category) => category.slug === query.category,
  );
  return (
    <div className="catalog-page">
      <nav aria-label="Jejak halaman" className="catalog-breadcrumb">
        <Link href="/">Beranda</Link>
        <span aria-hidden="true">/</span>
        <span>Katalog</span>
      </nav>
      <header className="catalog-heading">
        <div>
          <p className="catalog-kicker">Katalog / Demo</p>
          <h1>
            {query.q
              ? "Hasil pencarian"
              : selectedCategory
                ? selectedCategory.name
                : "Temukan produkmu."}
          </h1>
          <p>
            Jelajahi game dan layanan digital yang ada di katalog demo.
            Pembelian belum tersedia.
          </p>
        </div>
        <span className="catalog-heading-index" aria-hidden="true">
          TL / 06
        </span>
      </header>
      {catalog.state === "unavailable" ? (
        <section className="catalog-unavailable" role="status">
          <h2>Katalog belum tersedia.</h2>
          <p>
            Data demo sedang tidak dapat diakses, atau mode demo tidak aktif.
            Coba lagi nanti.
          </p>
          <Link href="/">
            Kembali ke beranda <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <>
          <form
            className="catalog-search-form"
            action="/products"
            method="get"
            role="search"
          >
            <label htmlFor="catalog-search">Cari game atau produk</label>
            <div className="catalog-search-line">
              <Search size={22} aria-hidden="true" />
              <input
                id="catalog-search"
                name="q"
                type="search"
                defaultValue={query.q}
                maxLength={80}
                placeholder="Contoh: mobile legends, ff, pulsa"
              />
              {query.category && (
                <input type="hidden" name="category" value={query.category} />
              )}
              {query.availability !== "all" && (
                <input
                  type="hidden"
                  name="availability"
                  value={query.availability}
                />
              )}
              {query.sort !== "display" && (
                <input type="hidden" name="sort" value={query.sort} />
              )}
              <button type="submit">
                Cari <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </form>
          <nav
            id="kategori"
            className="catalog-categories"
            aria-label="Kategori produk"
          >
            <Link
              href={catalogHref({
                q: query.q,
                availability: query.availability,
                sort: query.sort,
              })}
              aria-current={!query.category ? "page" : undefined}
            >
              Semua kategori
            </Link>
            {catalog.categories.map((category) => (
              <Link
                key={category.slug}
                href={catalogHref({
                  ...query,
                  category: category.slug as CatalogQuery["category"],
                })}
                aria-current={
                  query.category === category.slug ? "page" : undefined
                }
              >
                {category.name}
              </Link>
            ))}
          </nav>
          <div className="catalog-results-bar">
            <p aria-live="polite">
              <strong className="numeric">{results.count}</strong>{" "}
              {query.q
                ? `hasil untuk “${query.q}”`
                : "kelompok dan produk demo"}
            </p>
            {query.q && (
              <Link href={catalogHref({ category: query.category })}>
                Hapus pencarian
              </Link>
            )}
          </div>
          <FilterForm query={query} />
          {results.count === 0 ? (
            <section className="catalog-empty">
              <h2>Produk yang kamu cari belum ketemu.</h2>
              <p>Coba kata lain atau mulai lagi dari kategori yang tersedia.</p>
              <div>
                <Link href="/products">Lihat semua kategori</Link>
                <Link href="/products?category=game">Jelajahi game</Link>
              </div>
            </section>
          ) : (
            <div className="catalog-results">
              {results.groups.length > 0 && (
                <section aria-labelledby="catalog-games-title">
                  <div className="catalog-section-head">
                    <div>
                      <p className="catalog-kicker">Game</p>
                      <h2 id="catalog-games-title">
                        Pilih game, lalu lihat nominal.
                      </h2>
                    </div>
                    <span>{results.groups.length} judul</span>
                  </div>
                  <div className="catalog-game-grid">
                    {results.groups.map((group, index) => (
                      <Link
                        href={`/games/${group.slug}`}
                        className="catalog-game-card"
                        key={group.slug}
                      >
                        <span
                          className={`catalog-game-art catalog-game-art-${index % 6}`}
                          aria-hidden="true"
                        >
                          <strong>
                            {group.name
                              .split(" ")
                              .map((word) => word[0])
                              .slice(0, 2)
                              .join("")}
                          </strong>
                          <small>
                            TOPUPLAB / {String(index + 1).padStart(2, "0")}
                          </small>
                        </span>
                        <span className="catalog-game-body">
                          <strong>{group.name}</strong>
                          <small>{group.productCount} pilihan nominal</small>
                          <Availability available={group.availableCount > 0} />
                          <span className="catalog-link-cue">
                            Lihat nominal{" "}
                            <ArrowRight size={17} aria-hidden="true" />
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              {results.products.length > 0 && (
                <section aria-labelledby="catalog-products-title">
                  <div className="catalog-section-head">
                    <div>
                      <p className="catalog-kicker">Pilihan produk</p>
                      <h2 id="catalog-products-title">Nominal dan layanan</h2>
                    </div>
                    <span>{results.products.length} pilihan</span>
                  </div>
                  <div className="catalog-product-list">
                    {results.products.map((product) => (
                      <article
                        className="catalog-product-row"
                        key={product.slug}
                      >
                        <div>
                          <span>
                            {product.categoryName}
                            {product.groupName ? ` / ${product.groupName}` : ""}
                          </span>
                          <h3>{product.name}</h3>
                        </div>
                        <Availability available={product.available} />
                        {product.categorySlug === "game" &&
                          product.groupSlug && (
                            <Link href={`/games/${product.groupSlug}`}>
                              Lihat dalam game{" "}
                              <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                          )}
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
          <p className="catalog-disclaimer">
            Ketersediaan di halaman ini berasal dari konfigurasi demo, bukan
            penawaran atau stok langsung. Harga pembelian belum dihitung.
          </p>
        </>
      )}
    </div>
  );
}
