import Link from "next/link";
import { Brand } from "./brand";
import { getHomepageData } from "@/server/homepage";

export async function CustomerShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const demo = (await getHomepageData()).state === "demo";
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        Lewati ke konten
      </a>
      <header className="site-header">
        <div className="page-container header-inner">
          <Link className="brand-home" href="/" aria-label="TOPUPLAB, beranda">
            <Brand />
          </Link>
          <nav className="desktop-nav" aria-label="Navigasi utama">
            {demo && (
              <>
                <Link className="nav-link" href="/#cari">
                  Cari produk
                </Link>
                <Link className="nav-link" href="/#game">
                  Game
                </Link>
                <Link className="nav-link" href="/#digital">
                  Layanan digital
                </Link>
                <Link className="nav-link" href="/#flash-sale">
                  Flash sale
                </Link>
              </>
            )}
            <Link className="nav-link" href="/#bantuan">
              Bantuan
            </Link>
          </nav>
          <details className="mobile-nav">
            <summary>Menu</summary>
            <nav aria-label="Navigasi seluler">
              {demo && (
                <>
                  <Link href="/#cari">Cari produk</Link>
                  <Link href="/#game">Game</Link>
                  <Link href="/#digital">Layanan digital</Link>
                  <Link href="/#flash-sale">Flash sale</Link>
                </>
              )}
              <Link href="/#bantuan">Bantuan</Link>
            </nav>
          </details>
        </div>
      </header>
      <main id="main" className="page-container main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer page-container">
        <span>TOPUPLAB</span>
        <p>Top up game & kebutuhan digital. Transaksi belum tersedia.</p>
      </footer>
    </div>
  );
}
