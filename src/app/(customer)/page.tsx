import { AvailabilityDetails } from "@/components/availability-details";

export default function Home() {
  return (
    <>
      <section className="welcome" aria-labelledby="welcome-heading">
        <h1 id="welcome-heading">
          Tempat baru untuk
          <br />
          top up kamu.
        </h1>
        <p className="welcome-copy">
          Kami sedang menyiapkan TOPUPLAB untuk kebutuhan game dan digital kamu.
        </p>
      </section>
      <section
        id="ketersediaan"
        className="availability"
        aria-labelledby="availability-heading"
      >
        <div className="availability-heading">
          <span className="availability-label">Segera hadir</span>
          <h2 id="availability-heading">Layanan belum dibuka.</h2>
        </div>
        <div className="availability-content">
          <p>
            Katalog produk dan transaksi akan tersedia setelah persiapan
            selesai.
          </p>
          <AvailabilityDetails />
        </div>
      </section>
    </>
  );
}
