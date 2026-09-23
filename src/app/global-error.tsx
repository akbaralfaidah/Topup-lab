"use client";

import Link from "next/link";

export default function GlobalError() {
  return (
    <html lang="id">
      <body>
        <main>
          <h1>TOPUPLAB belum bisa dimuat.</h1>
          <p>Silakan muat ulang halaman beberapa saat lagi.</p>
          <Link href="/">Kembali ke beranda</Link>
        </main>
      </body>
    </html>
  );
}
