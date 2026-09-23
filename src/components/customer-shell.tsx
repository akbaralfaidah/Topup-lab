import Link from "next/link";
import { Brand } from "./brand";

export function CustomerShell({ children }: { children: React.ReactNode }) {
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
          <nav aria-label="Navigasi utama">
            <Link className="nav-link" href="/#ketersediaan">
              Info layanan
            </Link>
          </nav>
        </div>
      </header>
      <main id="main" className="page-container main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer page-container">
        <span>TOPUPLAB</span>
        <p>Top up game & kebutuhan digital.</p>
      </footer>
    </div>
  );
}
