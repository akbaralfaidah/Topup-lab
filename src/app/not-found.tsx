import Link from "next/link";
import { CustomerShell } from "@/components/customer-shell";

export default function NotFound() {
  return (
    <CustomerShell>
      <section className="state-content">
        <h1>Halaman tidak tersedia.</h1>
        <p>Alamat ini belum tersedia atau sudah berubah.</p>
        <Link className="button" href="/">
          Kembali ke beranda
        </Link>
      </section>
    </CustomerShell>
  );
}
