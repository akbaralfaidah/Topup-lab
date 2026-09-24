import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { createDatabase } from "@/server/db/connection";
import * as s from "@/server/db/schema";
import { localDemoCatalogEnabled } from "@/server/catalog-runtime";
import { getPublicCatalog } from "@/server/public-catalog";
import { groupDisplayOrder } from "@/lib/catalog-discovery";

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

export const getHomepageData = cache(async (): Promise<HomeData> => {
  if (!localDemoCatalogEnabled()) return empty;
  const catalog = await getPublicCatalog();
  if (catalog.state !== "demo") return empty;
  const { db, pool } = createDatabase(process.env.DATABASE_URL!);
  try {
    const [saleRows, itemRows, bannerRows, tierRows, settingRows] =
      await Promise.all([
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
            productName: s.products.name,
            price: s.flashSaleItems.priceIdr,
            quota: s.flashSaleItems.quota,
          })
          .from(s.flashSaleItems)
          .innerJoin(s.products, eq(s.flashSaleItems.productId, s.products.id)),
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
    const groups = new Map<string, HomeGroup>();
    for (const item of catalog.products) {
      if (!item.groupSlug || !item.groupName) continue;
      const current = groups.get(item.groupSlug) ?? {
        slug: item.groupSlug,
        name: item.groupName,
        category: item.categorySlug,
        packages: 0,
        available: false,
      };
      current.packages++;
      current.available ||= item.available;
      groups.set(current.slug, current);
    }
    const flashes: HomeFlash[] = saleRows.map((sale) => ({
      name: sale.name,
      state:
        referenceTime < sale.startsAt
          ? "Terjadwal"
          : referenceTime >= sale.endsAt
            ? "Selesai"
            : "Berlangsung",
      products: itemRows
        .filter((item) => item.saleId === sale.id)
        .map((item) => ({
          name: item.productName,
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
      categories: catalog.categories.map((row) => ({
        slug: row.slug,
        name: row.name,
        description: row.description,
      })),
      groups: [...groups.values()].sort(
        (a, b) =>
          (a.category === "game"
            ? -1
            : (catalog.categories.find((row) => row.slug === a.category)
                ?.sortOrder ?? 999)) -
            (b.category === "game"
              ? -1
              : (catalog.categories.find((row) => row.slug === b.category)
                  ?.sortOrder ?? 999)) ||
          (a.category === "game" ? groupDisplayOrder(a.slug) : 0) -
            (b.category === "game" ? groupDisplayOrder(b.slug) : 0) ||
          a.name.localeCompare(b.name, "id"),
      ),
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
