"use client";

import { Accordion } from "@/components/ui/navigation";

const answers: [string, string][] = [
  [
    "Apakah sudah bisa membeli?",
    "Belum. Katalog ini hanya menampilkan data demo. Pembelian dan pembayaran akan dibuka setelah alurnya siap.",
  ],
  [
    "Perlu akun untuk melihat produk?",
    "Tidak. Contoh katalog bisa dilihat tanpa akun. Ketentuan akun untuk transaksi akan dijelaskan saat layanan dibuka.",
  ],
  [
    "Bagaimana cara cek transaksi?",
    "Fitur pelacakan transaksi belum tersedia. Nantinya status pesanan akan ditampilkan setelah transaksi benar-benar dapat dibuat.",
  ],
  [
    "Apakah harga member berbeda?",
    "Tingkat member sudah disiapkan sebagai konfigurasi demo. Harga akhir dan manfaatnya belum berlaku untuk pembelian.",
  ],
];

export function HomeFaq() {
  return (
    <div className="home-faq-list">
      {answers.map(([question, answer]) => (
        <Accordion key={question} title={question}>
          {answer}
        </Accordion>
      ))}
    </div>
  );
}
