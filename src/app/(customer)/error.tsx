"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="state-content" role="alert">
      <h1>Halaman belum bisa dimuat.</h1>
      <p>
        Silakan coba lagi. Jika masih terkendala, buka kembali beberapa saat
        lagi.
      </p>
      <button className="button" type="button" onClick={reset}>
        Coba lagi
      </button>
    </section>
  );
}
