import * as s from "../../../src/server/db/schema";
import { demoId, schedules, timestamps } from "./shared";

export const promos: (typeof s.promos.$inferInsert)[] = [
  {
    key: "FIXED",
    name: "Contoh potongan nominal",
    type: "FIXED_DISCOUNT",
    fixedAmountIdr: 2000n,
    discountBps: null,
    window: "active",
    status: "ACTIVE",
  },
  {
    key: "PERCENT",
    name: "Contoh potongan persentase",
    type: "PERCENTAGE_DISCOUNT",
    fixedAmountIdr: null,
    discountBps: 500,
    window: "upcoming",
    status: "ACTIVE",
  },
  {
    key: "ADMIN",
    name: "Contoh bebas biaya admin",
    type: "FREE_ADMIN_FEE",
    fixedAmountIdr: null,
    discountBps: null,
    window: "expired",
    status: "ACTIVE",
  },
  {
    key: "CASHBACK",
    name: "Contoh cashback nonaktif",
    type: "CASHBACK",
    fixedAmountIdr: 1000n,
    discountBps: null,
    window: "active",
    status: "PAUSED",
  },
].map((p) => ({
  id: demoId(`promo/${p.key}`),
  code: `DEMO_${p.key}`,
  name: p.name,
  type: p.type as typeof s.promos.$inferInsert.type,
  status: p.status as typeof s.promos.$inferInsert.status,
  fixedAmountIdr: p.fixedAmountIdr,
  discountBps: p.discountBps,
  maximumDiscountIdr: 5000n,
  quota: 100,
  perUserLimit: 1,
  budgetIdr: 200000n,
  minimumPurchaseIdr: 20000n,
  firstOrderOnly: p.key === "FIXED",
  stacking: "EXCLUSIVE",
  ...schedules[p.window as keyof typeof schedules],
  ...timestamps,
}));
export const promoProducts: (typeof s.promoProducts.$inferInsert)[] = [
  {
    promoId: demoId("promo/FIXED"),
    productId: demoId("product/mobile-legends-86"),
  },
];
export const promoCategories: (typeof s.promoCategories.$inferInsert)[] = [
  { promoId: demoId("promo/PERCENT"), categoryId: demoId("category/game") },
  { promoId: demoId("promo/ADMIN"), categoryId: demoId("category/pln") },
];
export const promoTiers: (typeof s.promoTiers.$inferInsert)[] = [
  { promoId: demoId("promo/CASHBACK"), tierId: demoId("tier/member") },
];
export const flashSales: (typeof s.flashSales.$inferInsert)[] = (
  Object.keys(schedules) as (keyof typeof schedules)[]
).map((window) => ({
  id: demoId(`flash/${window}`),
  name: `Demo flash sale: ${{ active: "berlangsung", upcoming: "terjadwal", expired: "selesai" }[window]}`,
  status: "ACTIVE",
  ...schedules[window],
  ...timestamps,
}));
export const flashSaleItems: (typeof s.flashSaleItems.$inferInsert)[] = [
  "active",
  "upcoming",
  "expired",
].flatMap((window) =>
  [
    { key: "mobile-legends-86", price: 23000n },
    { key: "free-fire-140", price: 18500n },
  ].map((item) => ({
    id: demoId(`flash-item/${window}/${item.key}`),
    flashSaleId: demoId(`flash/${window}`),
    productId: demoId(`product/${item.key}`),
    priceIdr: item.price,
    quota: 20,
    perUserLimit: 2,
    ...timestamps,
  })),
);
