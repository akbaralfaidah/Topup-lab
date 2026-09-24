export const categorySlugs = [
  "game",
  "pulsa",
  "paket-data",
  "e-wallet",
  "pln",
  "voucher",
  "tagihan",
] as const;
export type CategorySlug = (typeof categorySlugs)[number];
export type AvailabilityFilter = "all" | "available" | "unavailable";
export type CatalogSort = "display" | "name";
export type CatalogQuery = {
  q: string;
  category: CategorySlug | null;
  availability: AvailabilityFilter;
  sort: CatalogSort;
};
export type PublicCategory = {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
};
export type PublicGroup = {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  productCount: number;
  availableCount: number;
  displayOrder: number;
};
export type PublicProduct = {
  slug: string;
  name: string;
  denomination: string;
  categorySlug: string;
  categoryName: string;
  groupSlug: string | null;
  groupName: string | null;
  available: boolean;
  sortOrder: number;
};
export type PublicCatalog = {
  state: "demo" | "unavailable";
  categories: PublicCategory[];
  groups: PublicGroup[];
  products: PublicProduct[];
};

export const unavailableCatalog: PublicCatalog = {
  state: "unavailable",
  categories: [],
  groups: [],
  products: [],
};

const alias: Record<string, string> = {
  ml: "mobile legends",
  "mobile legend": "mobile legends",
  ff: "free fire",
};
const gameDisplayOrder = [
  "mobile-legends",
  "free-fire",
  "pubg-mobile",
  "roblox",
  "valorant",
  "genshin-impact",
];

export function normalizeSearchQuery(value: string): string {
  return value
    .slice(0, 256)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80)
    .toLocaleLowerCase("id-ID");
}

function first(value: string | string[] | undefined): string {
  return typeof value === "string"
    ? value
    : Array.isArray(value)
      ? (value[0] ?? "")
      : "";
}

export function parseCatalogQuery(
  input: Record<string, string | string[] | undefined>,
): CatalogQuery {
  const category = first(input.category);
  const availability = first(input.availability);
  const sort = first(input.sort);
  return {
    q: normalizeSearchQuery(first(input.q)),
    category: categorySlugs.find((value) => value === category) ?? null,
    availability:
      availability === "available" || availability === "unavailable"
        ? availability
        : "all",
    sort: sort === "name" ? "name" : "display",
  };
}

export function catalogHref(query: Partial<CatalogQuery> = {}): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", normalizeSearchQuery(query.q));
  if (query.category) params.set("category", query.category);
  if (query.availability && query.availability !== "all")
    params.set("availability", query.availability);
  if (query.sort && query.sort !== "display") params.set("sort", query.sort);
  const search = params.toString();
  return search ? `/products?${search}` : "/products";
}

export function rankSearchText(
  name: string,
  query: string,
  group = "",
  category = "",
): number {
  const term =
    alias[normalizeSearchQuery(query)] ?? normalizeSearchQuery(query);
  if (!term) return 0;
  const title = normalizeSearchQuery(name);
  if (title === term) return 0;
  if (title.startsWith(term)) return 1;
  if (title.includes(term)) return 2;
  if (normalizeSearchQuery(group).includes(term)) return 3;
  if (normalizeSearchQuery(category).includes(term)) return 4;
  return Number.POSITIVE_INFINITY;
}

function availabilityMatches(available: boolean, filter: AvailabilityFilter) {
  return filter === "all" || (filter === "available" ? available : !available);
}

export function filterCatalog(catalog: PublicCatalog, query: CatalogQuery) {
  const categoryOrder = new Map(
    catalog.categories.map((category) => [category.slug, category.sortOrder]),
  );
  const groups = catalog.groups
    .filter(
      (group) =>
        group.categorySlug === "game" &&
        (!query.category || query.category === "game"),
    )
    .filter((group) =>
      availabilityMatches(group.availableCount > 0, query.availability),
    )
    .filter(
      (group) =>
        rankSearchText(group.name, query.q, "", group.categoryName) < Infinity,
    )
    .sort((a, b) =>
      query.sort === "name"
        ? a.name.localeCompare(b.name, "id")
        : (query.q
            ? rankSearchText(a.name, query.q, "", a.categoryName) -
              rankSearchText(b.name, query.q, "", b.categoryName)
            : 0) ||
          a.displayOrder - b.displayOrder ||
          a.name.localeCompare(b.name, "id"),
    );
  const shownGroups = new Set(groups.map((group) => group.slug));
  const products = catalog.products
    .filter(
      (product) => !query.category || product.categorySlug === query.category,
    )
    .filter((product) =>
      availabilityMatches(product.available, query.availability),
    )
    .filter(
      (product) =>
        rankSearchText(
          product.name,
          query.q,
          product.groupName ?? "",
          product.categoryName,
        ) < Infinity,
    )
    .filter(
      (product) =>
        product.categorySlug !== "game" ||
        ((query.q || query.availability !== "all") &&
          !shownGroups.has(product.groupSlug ?? "")),
    )
    .sort((a, b) =>
      query.sort === "name"
        ? a.name.localeCompare(b.name, "id")
        : (query.q
            ? rankSearchText(
                a.name,
                query.q,
                a.groupName ?? "",
                a.categoryName,
              ) -
              rankSearchText(b.name, query.q, b.groupName ?? "", b.categoryName)
            : 0) ||
          (categoryOrder.get(a.categorySlug) ?? 999) -
            (categoryOrder.get(b.categorySlug) ?? 999) ||
          (a.groupName ?? "").localeCompare(b.groupName ?? "", "id") ||
          a.sortOrder - b.sortOrder ||
          a.name.localeCompare(b.name, "id"),
    );
  return { groups, products, count: groups.length + products.length };
}

export function groupDisplayOrder(slug: string): number {
  const index = gameDisplayOrder.indexOf(slug);
  return index === -1 ? 100 : index;
}
