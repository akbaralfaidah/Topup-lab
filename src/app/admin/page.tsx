import Link from "next/link";

export default function AdminPage() {
  return (
    <section className="state-content">
      <h1>Administrasi TOPUPLAB</h1>
      <p>Aturan harga dapat ditinjau dan dikelola sesuai izin akun Anda.</p>
      <Link className="button" href="/admin/pricing">
        Buka aturan harga
      </Link>
    </section>
  );
}
