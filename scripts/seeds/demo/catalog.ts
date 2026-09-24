import * as s from "../../../src/server/db/schema";
import {
  inputDefinitionSchema,
  productMetadataSchema,
  type InputDefinition,
} from "../../../src/server/db/schema/validation";
import { demoId, demoTime, timestamps } from "./shared";

export const categories: (typeof s.categories.$inferInsert)[] = (
  [
    ["game", "Game", "Contoh pilihan kredit dan item game."],
    ["pulsa", "Pulsa", "Contoh nominal pulsa seluler."],
    ["paket-data", "Paket Data", "Contoh paket internet seluler."],
    ["e-wallet", "E-Wallet", "Contoh nominal isi saldo dompet digital."],
    ["pln", "PLN", "Contoh nominal token listrik prabayar."],
    ["voucher", "Voucher", "Contoh voucher digital."],
    [
      "tagihan",
      "Tagihan",
      "Contoh layanan tagihan, tanpa pemeriksaan tagihan.",
    ],
  ] as const
).map(([slug, name, description], sortOrder) => ({
  id: demoId(`category/${slug}`),
  slug,
  name,
  description,
  sortOrder,
  status: "ACTIVE",
  ...timestamps,
}));

function field(
  key: InputDefinition["fields"][number]["key"],
  label: string,
  format: InputDefinition["fields"][number]["format"] = "DIGITS",
  minLength = 4,
  maxLength = 20,
): InputDefinition["fields"][number] {
  return { key, label, format, required: true, minLength, maxLength };
}
const definitions: Record<string, InputDefinition["fields"]> = {
  ml: [
    field("user_id", "ID pengguna"),
    field("zone_id", "ID zona", "DIGITS", 1, 8),
  ],
  player: [field("user_id", "ID pemain")],
  roblox: [field("nickname", "Nama pengguna Roblox", "TEXT", 3, 20)],
  valorant: [field("nickname", "Riot ID dan tag", "TEXT", 3, 64)],
  genshin: [field("user_id", "UID pemain", "DIGITS", 9, 10)],
  phone: [
    field("phone_number", "Nomor ponsel Indonesia (+62)", "PHONE_E164", 11, 16),
  ],
  meter: [field("meter_number", "Nomor meter PLN", "DIGITS", 11, 12)],
  customer: [field("customer_number", "Nomor pelanggan", "DIGITS", 6, 20)],
};
export const inputSchemas: (typeof s.productInputSchemas.$inferInsert)[] =
  Object.entries(definitions).map(([key, fields]) => ({
    id: demoId(`input/${key}`),
    code: `DEMO_${key.toUpperCase()}`,
    version: 1,
    definition: inputDefinitionSchema.parse({ version: 1, fields }),
    createdAt: demoTime,
  }));

// Costs and packages are illustrative fixtures, not publisher or provider offers.
const groups = [
  {
    slug: "mobile-legends",
    name: "Mobile Legends",
    category: "game",
    input: "ml",
    unit: "Diamonds",
    amounts: [5, 12, 28, 59, 86, 172, 257, 344],
    costs: [1500n, 3500n, 7900n, 15800n, 22000n, 43900n, 65300n, 87000n],
  },
  {
    slug: "free-fire",
    name: "Free Fire",
    category: "game",
    input: "player",
    unit: "Diamonds",
    amounts: [5, 20, 50, 70, 140, 355],
    costs: [800n, 2800n, 6500n, 9000n, 17700n, 44500n],
  },
  {
    slug: "pubg-mobile",
    name: "PUBG Mobile",
    category: "game",
    input: "player",
    unit: "UC",
    amounts: [60, 325, 660],
    costs: [14000n, 68000n, 134000n],
  },
  {
    slug: "roblox",
    name: "Roblox",
    category: "game",
    input: "roblox",
    unit: "Robux",
    amounts: [80, 400, 800],
    costs: [15000n, 72000n, 142000n],
  },
  {
    slug: "valorant",
    name: "Valorant",
    category: "game",
    input: "valorant",
    unit: "Points",
    amounts: [125, 420, 700],
    costs: [14000n, 47000n, 77000n],
  },
  {
    slug: "genshin-impact",
    name: "Genshin Impact",
    category: "game",
    input: "genshin",
    unit: "Genesis Crystals",
    amounts: [60, 330, 1090],
    costs: [13000n, 65000n, 205000n],
  },
  {
    slug: "pulsa-demo",
    name: "Pulsa Demo",
    category: "pulsa",
    input: "phone",
    unit: "IDR",
    amounts: [10000, 25000, 50000, 100000],
    costs: [10500n, 24900n, 49500n, 98500n],
  },
  {
    slug: "data-demo",
    name: "Paket Data Demo",
    category: "paket-data",
    input: "phone",
    unit: "GB / 30 hari",
    amounts: [3, 8, 15],
    costs: [17000n, 35000n, 57000n],
  },
  {
    slug: "dompet-demo",
    name: "Dompet Digital Demo",
    category: "e-wallet",
    input: "phone",
    unit: "IDR",
    amounts: [20000, 50000, 100000],
    costs: [20500n, 50500n, 100500n],
  },
  {
    slug: "pln-token",
    name: "Token PLN Demo",
    category: "pln",
    input: "meter",
    unit: "IDR",
    amounts: [20000, 50000, 100000],
    costs: [20500n, 50500n, 100500n],
  },
  {
    slug: "voucher-demo",
    name: "Voucher Digital Demo",
    category: "voucher",
    input: "customer",
    unit: "IDR",
    amounts: [25000, 50000],
    costs: [23500n, 47000n],
  },
  {
    slug: "tagihan-demo",
    name: "Tagihan Listrik Demo",
    category: "tagihan",
    input: "customer",
    unit: "contoh IDR",
    amounts: [75000, 150000],
    costs: [75000n, 150000n],
  },
];
export const brands: (typeof s.brands.$inferInsert)[] = groups.map((g) => ({
  id: demoId(`brand/${g.slug}`),
  slug: g.slug,
  name: g.name,
  status: "ACTIVE",
  ...timestamps,
}));
export const catalog = groups.flatMap((g) =>
  g.amounts.map((amount, index) => ({
    key: `${g.slug}-${amount}`,
    costIdr: g.costs[index]!,
    row: {
      id: demoId(`product/${g.slug}-${amount}`),
      slug: `${g.slug}-${amount}`,
      name: `${g.name} ${amount} ${g.unit}`,
      categoryId: demoId(`category/${g.category}`),
      brandId: demoId(`brand/${g.slug}`),
      inputSchemaId: demoId(`input/${g.input}`),
      description:
        "Data demo. Nominal, paket, dan ketersediaan hanya untuk pengujian tampilan.",
      status: "ACTIVE" as const,
      sortOrder: index,
      iconRef: "/brand/mark.svg",
      coverRef: null,
      metadata: productMetadataSchema.parse({ tags: ["demo", g.category] }),
      ...timestamps,
    } satisfies typeof s.products.$inferInsert,
  })),
);
export const products = catalog.map(({ row }) => row);
