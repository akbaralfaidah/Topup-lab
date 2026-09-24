import assert from "node:assert/strict";
import test from "node:test";
import {
  catalogHref,
  filterCatalog,
  normalizeSearchQuery,
  parseCatalogQuery,
  rankSearchText,
  type PublicCatalog,
} from "../src/lib/catalog-discovery";

const catalog: PublicCatalog = {
  state: "demo",
  categories: [
    { slug: "game", name: "Game", description: "", sortOrder: 0 },
    { slug: "pulsa", name: "Pulsa", description: "", sortOrder: 1 },
  ],
  groups: [
    {
      slug: "mobile-legends",
      name: "Mobile Legends",
      categorySlug: "game",
      categoryName: "Game",
      productCount: 2,
      availableCount: 1,
      displayOrder: 0,
    },
    {
      slug: "free-fire",
      name: "Free Fire",
      categorySlug: "game",
      categoryName: "Game",
      productCount: 1,
      availableCount: 0,
      displayOrder: 1,
    },
  ],
  products: [
    {
      slug: "ml-5",
      name: "Mobile Legends 5 Diamonds",
      denomination: "5 Diamonds",
      categorySlug: "game",
      categoryName: "Game",
      groupSlug: "mobile-legends",
      groupName: "Mobile Legends",
      available: false,
      sortOrder: 0,
    },
    {
      slug: "ml-86",
      name: "Mobile Legends 86 Diamonds",
      denomination: "86 Diamonds",
      categorySlug: "game",
      categoryName: "Game",
      groupSlug: "mobile-legends",
      groupName: "Mobile Legends",
      available: true,
      sortOrder: 1,
    },
    {
      slug: "ff-20",
      name: "Free Fire 20 Diamonds",
      denomination: "20 Diamonds",
      categorySlug: "game",
      categoryName: "Game",
      groupSlug: "free-fire",
      groupName: "Free Fire",
      available: false,
      sortOrder: 0,
    },
    {
      slug: "pulsa-10",
      name: "Pulsa Demo 10000 IDR",
      denomination: "10000 IDR",
      categorySlug: "pulsa",
      categoryName: "Pulsa",
      groupSlug: "pulsa-demo",
      groupName: "Pulsa Demo",
      available: true,
      sortOrder: 0,
    },
  ],
};

test("search normalization and aliases are bounded and deterministic", () => {
  assert.equal(normalizeSearchQuery("  MOBILE   Legends  "), "mobile legends");
  assert.equal(normalizeSearchQuery("a".repeat(300)).length, 80);
  assert.equal(rankSearchText("Mobile Legends", "ml"), 0);
  assert.equal(rankSearchText("Free Fire", "ff"), 0);
  assert.equal(rankSearchText("Mobile Legends", "mobile legend"), 0);
  assert.equal(
    rankSearchText("Mobile Legends 86 Diamonds", "mobile legends"),
    1,
  );
  assert.equal(rankSearchText("Mobile Legends", "game", "", "Game"), 4);
});

test("query parser rejects unknown filters and builds shareable URLs", () => {
  assert.deepEqual(
    parseCatalogQuery({
      category: "provider",
      availability: "offline",
      sort: "cheapest",
      q: [" FF ", "ignored"],
    }),
    {
      q: "ff",
      category: null,
      availability: "all",
      sort: "display",
    },
  );
  assert.equal(
    catalogHref({
      q: " Mobile  Legends ",
      category: "game",
      availability: "available",
      sort: "name",
    }),
    "/products?q=mobile+legends&category=game&availability=available&sort=name",
  );
});

test("game groups remain distinct from denominations in browse and search", () => {
  const browse = filterCatalog(catalog, parseCatalogQuery({}));
  assert.deepEqual(
    browse.groups.map((group) => group.slug),
    ["mobile-legends", "free-fire"],
  );
  assert.deepEqual(
    browse.products.map((item) => item.slug),
    ["pulsa-10"],
  );
  const brandSearch = filterCatalog(catalog, parseCatalogQuery({ q: "ml" }));
  assert.deepEqual(
    brandSearch.groups.map((group) => group.slug),
    ["mobile-legends"],
  );
  assert.equal(brandSearch.products.length, 0);
  const denominationSearch = filterCatalog(
    catalog,
    parseCatalogQuery({ q: "86" }),
  );
  assert.deepEqual(
    denominationSearch.products.map((item) => item.slug),
    ["ml-86"],
  );
});

test("category, availability and alphabetical sort use public fields only", () => {
  const pulsa = filterCatalog(
    catalog,
    parseCatalogQuery({ category: "pulsa" }),
  );
  assert.equal(pulsa.groups.length, 0);
  assert.deepEqual(
    pulsa.products.map((item) => item.slug),
    ["pulsa-10"],
  );
  const unavailable = filterCatalog(
    catalog,
    parseCatalogQuery({ category: "game", availability: "unavailable" }),
  );
  assert.deepEqual(
    unavailable.groups.map((group) => group.slug),
    ["free-fire"],
  );
  assert.deepEqual(
    unavailable.products.map((item) => item.slug),
    ["ml-5"],
  );
  const alpha = filterCatalog(
    catalog,
    parseCatalogQuery({ category: "game", sort: "name" }),
  );
  assert.deepEqual(
    alpha.groups.map((group) => group.slug),
    ["free-fire", "mobile-legends"],
  );
});
