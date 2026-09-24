import type { Metadata } from "next";
import {
  ArrowDownRight,
  ArrowRight,
  Bolt,
  CreditCard,
  Gamepad2,
  Gift,
  ReceiptText,
  Search,
  Smartphone,
  Wallet,
  Zap,
} from "lucide-react";
import { getHomepageData } from "@/server/homepage";
import { HomeSearch } from "@/components/home-search";
import { HomeFaq } from "@/components/home-faq";
import "./home.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "TOPUPLAB | Temukan top up game dan kebutuhan digital" },
  description:
    "Jelajahi pilihan game dan layanan digital di TOPUPLAB. Katalog demo tersedia untuk pratinjau; transaksi belum dibuka.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TOPUPLAB — Top up yang dicari, langsung ketemu",
    description:
      "Temukan pilihan game dan layanan digital. Saat ini katalog hanya untuk pratinjau demo.",
    type: "website",
    url: "/",
  },
  robots: { index: false, follow: false },
};

const iconByCategory = {
  game: Gamepad2,
  pulsa: Smartphone,
  "paket-data": Bolt,
  "e-wallet": Wallet,
  pln: Zap,
  voucher: Gift,
  tagihan: ReceiptText,
};
const idr = new Intl.NumberFormat("id-ID");

export default async function Home() {
  const data = await getHomepageData();
  const games = data.groups.filter((group) => group.category === "game");
  const ppob = data.categories.filter((category) => category.slug !== "game");
  const flash =
    data.flashes.find((sale) => sale.state === "Berlangsung") ??
    data.flashes[0];
  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dash" /> TOPUPLAB / KATALOG DEMO
          </p>
          <h1 id="home-title">
            Top up yang dicari, <em>langsung ketemu.</em>
          </h1>
          <p className="hero-intro">
            Game favorit dan kebutuhan digital, dalam satu tempat yang mudah
            dijelajahi. Saat ini kamu bisa melihat katalog demo; transaksi belum
            dibuka.
          </p>
          {data.state === "demo" ? (
            <div id="cari">
              <HomeSearch groups={data.groups} />
            </div>
          ) : (
            <div className="home-unavailable" role="status">
              <Search size={23} aria-hidden="true" />
              <div>
                <strong>Katalog belum tersedia.</strong>
                <p>
                  Data demo sedang tidak dapat diakses, atau mode demo tidak
                  aktif. Coba lagi nanti.
                </p>
              </div>
            </div>
          )}
          {data.state === "demo" && (
            <p className="hero-suggestions">
              Coba cari <a href="#game">Mobile Legends</a>,{" "}
              <a href="#game">Free Fire</a>, atau lihat{" "}
              <a href="#kategori">semua kategori</a>.
            </p>
          )}
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-header">
            <span>01 / TEMUKAN</span>
            <ArrowDownRight size={24} />
          </div>
          <div className="hero-art-word">
            TOP<span>UP</span>
          </div>
          <div className="hero-art-bottom">
            <span>PILIH · TINJAU · LANJUT NANTI</span>
            <span className="hero-art-grid">▦</span>
          </div>
        </div>
      </section>

      {data.state === "demo" && (
        <>
          <section
            id="kategori"
            className="home-section category-section"
            aria-labelledby="category-title"
          >
            <div className="section-head">
              <div>
                <p className="section-kicker">Jelajahi</p>
                <h2 id="category-title">Mau isi apa hari ini?</h2>
              </div>
              <p>Mulai dari game, lanjut ke kebutuhan harian.</p>
            </div>
            <div className="category-strip">
              {data.categories.map((category, index) => {
                const Icon =
                  iconByCategory[
                    category.slug as keyof typeof iconByCategory
                  ] ?? CreditCard;
                return (
                  <a
                    href={category.slug === "game" ? "#game" : "#digital"}
                    className="category-shortcut"
                    key={category.slug}
                    aria-label={`Lihat ${category.name}`}
                  >
                    <span className="category-index">0{index + 1}</span>
                    <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
                    <strong>{category.name}</strong>
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </section>

          <section
            id="game"
            className="home-section games-section"
            aria-labelledby="games-title"
          >
            <div className="section-head">
              <div>
                <p className="section-kicker">Katalog / Game</p>
                <h2 id="games-title">Pilihan game di katalog</h2>
              </div>
              <p>
                Pilih judulnya dulu. Setiap game punya beberapa pilihan nominal
                demo.
              </p>
            </div>
            <div className="game-grid">
              {games.map((game, index) => (
                <article className="game-tile" key={game.slug}>
                  <div
                    className={`game-art game-art-${index % 6}`}
                    aria-hidden="true"
                  >
                    <span>
                      {game.name
                        .split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <small>TL / {String(index + 1).padStart(2, "0")}</small>
                  </div>
                  <div className="game-info">
                    <div>
                      <h3>{game.name}</h3>
                      <p>{game.packages} pilihan nominal</p>
                    </div>
                    <span className="game-availability">
                      {game.available ? "Contoh tersedia" : "Belum tersedia"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <p className="section-footnote">
              Nama game untuk identifikasi katalog. Visual di atas adalah grafis
              TOPUPLAB, bukan logo atau artwork resmi.
            </p>
          </section>

          {flash && (
            <section
              id="flash-sale"
              className="home-section flash-section"
              aria-labelledby="flash-title"
            >
              <div className="flash-heading">
                <div>
                  <p className="section-kicker">Konfigurasi promo / Demo</p>
                  <h2 id="flash-title">Jadwal flash sale</h2>
                  <p>
                    Contoh jadwal pada{" "}
                    <strong>24 September 2026, 12.00 WIB</strong>. Harga dan
                    kuota di bawah bukan penawaran saat ini.
                  </p>
                </div>
                <span className="flash-state">
                  {flash.state} pada waktu acuan
                </span>
              </div>
              <div className="flash-items">
                {flash.products.map((product) => (
                  <div className="flash-item" key={product.name}>
                    <div>
                      <span className="flash-mini-art" aria-hidden="true">
                        <Zap size={20} />
                      </span>
                      <strong>{product.name}</strong>
                      <small>Kuota konfigurasi: {product.quota}</small>
                    </div>
                    <span className="flash-price">
                      <small>Harga contoh</small>
                      <strong>Rp{idr.format(Number(product.price))}</strong>
                    </span>
                  </div>
                ))}
              </div>
              <p className="flash-note">
                Belum ada pemesanan atau penghitungan stok terjual di katalog
                demo.
              </p>
            </section>
          )}

          <section
            id="digital"
            className="home-section digital-section"
            aria-labelledby="digital-title"
          >
            <div className="section-head">
              <div>
                <p className="section-kicker">Selain game</p>
                <h2 id="digital-title">Urusan digital, satu arah.</h2>
              </div>
              <p>Pilihan layanan di bawah masih berupa contoh katalog.</p>
            </div>
            <div className="digital-list">
              {ppob.map((category, index) => {
                const Icon =
                  iconByCategory[
                    category.slug as keyof typeof iconByCategory
                  ] ?? CreditCard;
                return (
                  <div className="digital-row" key={category.slug}>
                    <span className="digital-no">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon size={22} aria-hidden="true" />
                    <strong>{category.name}</strong>
                    <p>{category.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {data.banner && (
            <section
              className="home-banner"
              aria-label="Informasi katalog demo"
            >
              <div className="banner-copy">
                <p className="section-kicker">Catatan dari TOPUPLAB</p>
                <h2>{data.banner.title}</h2>
                <p>{data.banner.copy}</p>
              </div>
              <div className="banner-symbol" aria-hidden="true">
                <span>T</span>
                <span>L</span>
              </div>
            </section>
          )}

          <section
            id="member"
            className="home-section member-section"
            aria-labelledby="member-title"
          >
            <div>
              <p className="section-kicker">Tingkat akun / Demo</p>
              <h2 id="member-title">Satu katalog, beberapa tingkat akun.</h2>
              <p>
                Konfigurasi tingkat akun sudah ada. Aturan harga dan manfaatnya
                masih contoh; belum berlaku untuk transaksi.
              </p>
            </div>
            <ol className="tier-list">
              {data.tiers.map((tier, index) => (
                <li key={tier}>
                  <span>0{index + 1}</span>
                  <strong>{tier}</strong>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      <section className="home-section how-section" aria-labelledby="how-title">
        <div className="section-head">
          <div>
            <p className="section-kicker">Alur yang disiapkan</p>
            <h2 id="how-title">Dari cari sampai selesai.</h2>
          </div>
          <p>Gambaran alur nanti. Transaksi belum tersedia.</p>
        </div>
        <ol className="how-list">
          <li>
            <span>01</span>
            <strong>Cari produk</strong>
            <p>Temukan game atau layanan.</p>
          </li>
          <li>
            <span>02</span>
            <strong>Pilih kebutuhan</strong>
            <p>Tentukan pilihan dan tujuan.</p>
          </li>
          <li>
            <span>03</span>
            <strong>Tinjau pembayaran</strong>
            <p>Lihat rincian sebelum membayar.</p>
          </li>
          <li>
            <span>04</span>
            <strong>Pantau pesanan</strong>
            <p>Ikuti status setelah diproses.</p>
          </li>
        </ol>
      </section>

      <section className="home-proof" aria-labelledby="proof-title">
        <div>
          <p className="section-kicker">Jelas sejak awal</p>
          <h2 id="proof-title">Apa yang bisa dilihat sekarang.</h2>
        </div>
        <ul>
          <li>Katalog dikelompokkan per game dan layanan.</li>
          <li>Jadwal promo demo memakai waktu acuan yang ditampilkan.</li>
          <li>Belum ada pembelian atau pembayaran di halaman ini.</li>
        </ul>
      </section>

      <section
        id="bantuan"
        className="home-section faq-section"
        aria-labelledby="faq-title"
      >
        <div>
          <p className="section-kicker">Bantuan</p>
          <h2 id="faq-title">Yang perlu diketahui.</h2>
          <p>Jawaban singkat tentang kondisi layanan saat ini.</p>
        </div>
        <HomeFaq />
      </section>

      <aside className="home-endnote">
        <strong>TOPUPLAB sedang disiapkan.</strong>
        <span>
          Katalog demo dapat dijelajahi, tetapi belum menerima pesanan.
        </span>
        {data.contact && !data.contact.endsWith("@example.invalid") && (
          <a href={`mailto:${data.contact}`}>
            Hubungi {data.contact} <ArrowRight size={16} aria-hidden="true" />
          </a>
        )}
        {data.contact?.endsWith("@example.invalid") && (
          <span>Kontak publik demo belum aktif.</span>
        )}
      </aside>
    </>
  );
}
