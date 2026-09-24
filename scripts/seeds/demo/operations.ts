import * as s from "../../../src/server/db/schema";
import { settingValueSchema } from "../../../src/server/db/schema/validation";
import { demoId, schedules, timestamps } from "./shared";

export const banners: (typeof s.cmsBanners.$inferInsert)[] = (
  [
    [
      "topup",
      "Pilih nominal untuk contoh top up",
      "Katalog demo berisi pilihan game, pulsa, dan layanan digital. Tidak ada pembelian.",
    ],
    [
      "member",
      "Bandingkan contoh tingkat member",
      "Public, Member, Gold, dan Reseller memakai aturan harga demo yang berbeda.",
    ],
    [
      "flash",
      "Lihat contoh jadwal flash sale",
      "Jadwal dan kuota ini untuk pengujian. Belum ada penjualan atau reservasi.",
    ],
  ] as const
).map(([key, title, copy]) => ({
  id: demoId(`banner/${key}`),
  name: `Demo ${key}`,
  slot: "HOME_DEMO",
  title,
  copy,
  mediaRef: "/brand/mark.svg",
  ctaLabel: null,
  ctaPath: null,
  enabled: true,
  ...schedules.active,
  ...timestamps,
}));
export const settings: (typeof s.systemSettings.$inferInsert)[] = [
  { key: "PUBLIC_CONTACT", value: { email: "demo.support@example.invalid" } },
  {
    key: "RECEIPT_COPY",
    value: { footer: "Data demo TOPUPLAB. Bukan bukti pembayaran." },
  },
  { key: "CATALOG_PAGE_SIZE", value: { count: 24 } },
].map((value) => {
  const parsed = settingValueSchema.parse(value);
  return { id: demoId(`setting/${parsed.key}`), ...parsed, ...timestamps };
});
