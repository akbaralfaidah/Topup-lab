import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { createDatabase } from "@/server/db/connection";
import * as s from "@/server/db/schema";

export type HomeCategory = { slug: string; name: string; description: string };
export type HomeGroup = {
  slug: string;
  name: string;
  category: string;
  packages: number;
  available: boolean;
};
export type HomeFlash = {
  name: string;
  state: "Berlangsung" | "Terjadwal" | "Selesai";
  products: { name: string; price: string; quota: number }[];
};
export type HomeData = {
  state: "demo" | "unavailable";
  categories: HomeCategory[];
  groups: HomeGroup[];
  flashes: HomeFlash[];
  banner: { title: string; copy: string } | null;
  tiers: string[];
  contact: string | null;
};

const empty: HomeData = {
  state: "unavailable",
  categories: [],
  groups: [],
  flashes: [],
  banner: null,
  tiers: [],
  contact: null,
};
const referenceTime = new Date("2026-09-24T05:00:00.000Z");

function localDemoUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      url.hostname === "127.0.0.1" &&
      url.port === "55417" &&
      url.username === "topuplab_local" &&
      /^topuplab_demo_[a-f0-9]{12}$/.test(url.pathname.slice(1))
    );
  } catch {
    return false;
  }
}

export const getHomepageData = cache(async (): Promise<HomeData> => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.APP_MODE !== "demo" ||
    !localDemoUrl(process.env.DATABASE_URL)
  )
    return empty;

  const { db, pool } = createDatabase(process.env.DATABASE_URL!);
  try {
    const [
      categoryRows,
      brandRows,
      productRows,
      supplyRows,
      saleRows,
      itemRows,
      bannerRows,
      tierRows,
      settingRows,
    ] = await Promise.all([
      db
        .select({
          id: s.categories.id,
          slug: s.categories.slug,
          name: s.categories.name,
          description: s.categories.description,
        })
        .from(s.categories)
        .where(eq(s.categories.status, "ACTIVE"))
        .orderBy(s.categories.sortOrder),
      db
        .select({ id: s.brands.id, slug: s.brands.slug, name: s.brands.name })
        .from(s.brands)
        .where(eq(s.brands.status, "ACTIVE")),
      db
        .select({
          id: s.products.id,
          name: s.products.name,
          categoryId: s.products.categoryId,
          brandId: s.products.brandId,
        })
        .from(s.products)
        .where(eq(s.products.status, "ACTIVE")),
      db
        .select({
          productId: s.providerSkus.productId,
          available: s.providerSkus.available,
          stockState: s.providerSkus.stockState,
          skuEnabled: s.providerSkus.enabled,
          providerEnabled: s.providers.enabled,
          providerState: s.providers.operationalState,
        })
        .from(s.providerSkus)
        .innerJoin(s.providers, eq(s.providerSkus.providerId, s.providers.id)),
      db
        .select({
          id: s.flashSales.id,
          name: s.flashSales.name,
          startsAt: s.flashSales.startsAt,
          endsAt: s.flashSales.endsAt,
        })
        .from(s.flashSales)
        .where(eq(s.flashSales.status, "ACTIVE")),
      db
        .select({
          saleId: s.flashSaleItems.flashSaleId,
          productId: s.flashSaleItems.productId,
          price: s.flashSaleItems.priceIdr,
          quota: s.flashSaleItems.quota,
        })
        .from(s.flashSaleItems),
      db
        .select({
          title: s.cmsBanners.title,
          copy: s.cmsBanners.copy,
          startsAt: s.cmsBanners.startsAt,
          endsAt: s.cmsBanners.endsAt,
        })
        .from(s.cmsBanners)
        .where(
          and(
            eq(s.cmsBanners.enabled, true),
            eq(s.cmsBanners.slot, "HOME_DEMO"),
            eq(s.cmsBanners.name, "Demo topup"),
          ),
        ),
      db
        .select({ name: s.membershipTiers.name })
        .from(s.membershipTiers)
        .where(eq(s.membershipTiers.active, true))
        .orderBy(s.membershipTiers.level),
      db
        .select({ value: s.systemSettings.value })
        .from(s.systemSettings)
        .where(eq(s.systemSettings.key, "PUBLIC_CONTACT")),
    ]);
    if (categoryRows.length === 0 || productRows.length === 0) return empty;
    const available = new Set(
      supplyRows
        .filter(
          (row) =>
            row.available &&
            row.skuEnabled &&
            row.providerEnabled &&
            row.providerState === "HEALTHY" &&
            row.stockState !== "OUT_OF_STOCK",
        )
        .map((row) => row.productId),
    );
    const categoryById = new Map(categoryRows.map((row) => [row.id, row.slug]));
    const productById = new Map(productRows.map((row) => [row.id, row]));
    const groups = brandRows
      .map((brand) => {
        const items = productRows.filter(
          (product) => product.brandId === brand.id,
        );
        return {
          slug: brand.slug,
          name: brand.name,
          category: categoryById.get(items[0]?.categoryId ?? "") ?? "",
          packages: items.length,
          available: items.some((item) => available.has(item.id)),
        };
      })
      .filter((group) => group.packages > 0 && group.category);
    const flashes: HomeFlash[] = saleRows.map((sale) => ({
      name: sale.name,
      state:
        referenceTime < sale.startsAt
          ? "Terjadwal"
          : referenceTime >= sale.endsAt
            ? "Selesai"
            : "Berlangsung",
      products: itemRows
        .filter(
          (item) => item.saleId === sale.id && productById.has(item.productId),
        )
        .map((item) => ({
          name: productById.get(item.productId)!.name,
          price: item.price.toString(),
          quota: item.quota,
        })),
    }));
    const banner = bannerRows.find(
      (row) =>
        (!row.startsAt || row.startsAt <= referenceTime) &&
        (!row.endsAt || row.endsAt > referenceTime),
    );
    const contact = settingRows[0]?.value;
    return {
      state: "demo",
      categories: categoryRows.map((row) => ({
        slug: row.slug,
        name: row.name,
        description: row.description ?? "",
      })),
      groups,
      flashes,
      banner: banner ? { title: banner.title, copy: banner.copy ?? "" } : null,
      tiers: tierRows.map((row) => row.name),
      contact: contact && "email" in contact ? contact.email : null,
    };
  } catch {
    return empty;
  } finally {
    await pool.end();
  }
});
