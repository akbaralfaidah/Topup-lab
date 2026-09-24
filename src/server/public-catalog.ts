import "server-only";
import { cache } from "react";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { createDatabase } from "@/server/db/connection";
import * as s from "@/server/db/schema";
import { localDemoCatalogEnabled } from "@/server/catalog-runtime";
import {
  groupDisplayOrder,
  unavailableCatalog,
  type PublicCatalog,
  type PublicProduct,
} from "@/lib/catalog-discovery";

type Database = ReturnType<typeof createDatabase>["db"];

export async function readPublicCatalog(db: Database): Promise<PublicCatalog> {
  const [categories, productRows] = await Promise.all([
    db
      .select({
        slug: s.categories.slug,
        name: s.categories.name,
        description: s.categories.description,
        sortOrder: s.categories.sortOrder,
      })
      .from(s.categories)
      .where(eq(s.categories.status, "ACTIVE"))
      .orderBy(s.categories.sortOrder, s.categories.slug),
    db
      .select({
        slug: s.products.slug,
        name: s.products.name,
        sortOrder: s.products.sortOrder,
        categorySlug: s.categories.slug,
        categoryName: s.categories.name,
        groupSlug: s.brands.slug,
        groupName: s.brands.name,
        id: s.products.id,
      })
      .from(s.products)
      .innerJoin(s.categories, eq(s.products.categoryId, s.categories.id))
      .leftJoin(s.brands, eq(s.products.brandId, s.brands.id))
      .where(
        and(
          eq(s.products.status, "ACTIVE"),
          eq(s.categories.status, "ACTIVE"),
          or(isNull(s.brands.id), eq(s.brands.status, "ACTIVE")),
        ),
      )
      .orderBy(s.categories.sortOrder, s.products.sortOrder, s.products.name)
      .limit(200),
  ]);
  if (!categories.length || !productRows.length || productRows.length >= 200)
    return unavailableCatalog;
  const supplyRows = await db
    .select({
      productId: s.providerSkus.productId,
      available: sql<boolean>`bool_or(${s.providerSkus.enabled} AND ${s.providerSkus.available} AND ${s.providers.enabled} AND ${s.providers.operationalState} IN ('HEALTHY','DEGRADED') AND ${s.providerSkus.stockState} <> 'OUT_OF_STOCK')`,
    })
    .from(s.providerSkus)
    .innerJoin(s.providers, eq(s.providerSkus.providerId, s.providers.id))
    .where(
      inArray(
        s.providerSkus.productId,
        productRows.map((row) => row.id),
      ),
    )
    .groupBy(s.providerSkus.productId);
  const availability = new Map(
    supplyRows.map((row) => [row.productId, row.available]),
  );
  const products: PublicProduct[] = productRows.map((row) => ({
    slug: row.slug,
    name: row.name,
    denomination:
      row.groupName && row.name.startsWith(`${row.groupName} `)
        ? row.name.slice(row.groupName.length + 1)
        : row.name,
    categorySlug: row.categorySlug,
    categoryName: row.categoryName,
    groupSlug: row.groupSlug,
    groupName: row.groupName,
    available: availability.get(row.id) === true,
    sortOrder: row.sortOrder,
  }));
  const groups = new Map<string, PublicCatalog["groups"][number]>();
  for (const product of products) {
    if (
      product.categorySlug !== "game" ||
      !product.groupSlug ||
      !product.groupName
    )
      continue;
    const group = groups.get(product.groupSlug) ?? {
      slug: product.groupSlug,
      name: product.groupName,
      categorySlug: product.categorySlug,
      categoryName: product.categoryName,
      productCount: 0,
      availableCount: 0,
      displayOrder: groupDisplayOrder(product.groupSlug),
    };
    group.productCount++;
    if (product.available) group.availableCount++;
    groups.set(group.slug, group);
  }
  return {
    state: "demo",
    categories: categories.map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description ?? "",
      sortOrder: row.sortOrder,
    })),
    groups: [...groups.values()].sort(
      (a, b) =>
        a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "id"),
    ),
    products,
  };
}

export const getPublicCatalog = cache(async (): Promise<PublicCatalog> => {
  if (!localDemoCatalogEnabled()) return unavailableCatalog;
  const { db, pool } = createDatabase(process.env.DATABASE_URL!);
  try {
    return await readPublicCatalog(db);
  } catch {
    return unavailableCatalog;
  } finally {
    await pool.end();
  }
});
