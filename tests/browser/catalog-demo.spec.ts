import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const forbidden =
  /DEMO_ALPHA|providerCostIdr|costIdr|routingPriority|topuplab_demo_[a-f0-9]{12}/;

test("catalog projection, category links, and game groups are customer-safe", async ({
  page,
}) => {
  const response = await page.goto("/products");
  expect(response?.status()).toBe(200);
  expect(await response!.text()).not.toMatch(forbidden);
  await expect(page.locator(".catalog-game-card")).toHaveCount(6);
  await expect(
    page.getByRole("navigation", { name: "Kategori produk" }).getByRole("link"),
  ).toHaveCount(8);
  await page
    .getByRole("navigation", { name: "Kategori produk" })
    .getByRole("link", { name: "Pulsa" })
    .click();
  await expect(page).toHaveURL(/\/products\?category=pulsa$/);
  await expect(page.locator(".catalog-game-card")).toHaveCount(0);
  await expect(page.locator(".catalog-product-row")).not.toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Pulsa", level: 1 }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Kategori produk" })
    .getByRole("link", { name: "Semua kategori" })
    .click();
  await expect(page.locator(".catalog-game-card")).toHaveCount(6);
  await page.goBack();
  await expect(page).toHaveURL(/category=pulsa/);
  await page.goForward();
  await expect(page).toHaveURL(/\/products$/);
});

test("search, alias, invalid input, filtering, and honest empty state", async ({
  page,
}) => {
  await page.goto("/products?q=ff");
  await expect(
    page.getByRole("link", { name: /Free Fire.*Lihat nominal/ }),
  ).toBeVisible();
  await expect(page.locator(".catalog-game-card")).toHaveCount(1);
  await page.goto("/products?q=mobile%20legend");
  await expect(
    page.getByRole("link", { name: /Mobile Legends.*Lihat nominal/ }),
  ).toBeVisible();
  await page.goto("/products?q=86");
  await expect(page.locator(".catalog-product-row")).not.toHaveCount(0);
  await page.goto("/products?category=bad&availability=bad&sort=bad");
  await expect(page.locator(".catalog-game-card")).toHaveCount(6);
  await page.goto("/products?category=game&availability=unavailable");
  await expect(page.getByLabel("Ketersediaan")).toHaveValue("unavailable");
  await expect(page.locator(".catalog-product-row")).not.toHaveCount(0);
  await expect(
    page.locator(".catalog-availability.is-unavailable").first(),
  ).toBeVisible();
  await page.goto("/products?q=tidak-ada-produk");
  await expect(
    page.getByRole("heading", { name: "Produk yang kamu cari belum ketemu." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Lihat semua kategori" }).click();
  await expect(page).toHaveURL(/\/products$/);
});

test("homepage discovery enters game preview without purchase controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".game-tile").first().click();
  await expect(page).toHaveURL(/\/games\//);
  await expect(
    page
      .locator(".game-denominations")
      .getByRole("heading", { name: "Pilih nominal" }),
  ).toBeVisible();
  await expect(page.locator(".game-denominations li")).not.toHaveCount(0);
  await expect(page.locator(".game-denominations li").first()).toContainText(
    "5 Diamonds",
  );
  await expect(page.locator(".game-denominations li").first()).toContainText(
    "Sementara tidak tersedia",
  );
  await expect(page.locator(".game-denominations li").nth(1)).toContainText(
    "Rp",
  );
  expect(await page.content()).not.toMatch(forbidden);
  await expect(page.getByText("Belum ada pesanan yang dibuat.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /beli|bayar|checkout/i }),
  ).toHaveCount(0);
});

for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
  test(`catalog layout ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/products");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
    await expect(
      page.getByRole("navigation", { name: "Kategori produk" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Terapkan" })).toBeVisible();
    if (width === 390 || width === 1440) {
      await page.screenshot({
        path: `artifacts/catalog-${width}.png`,
        fullPage: true,
      });
      await page.goto("/products?q=mobile");
      await page.screenshot({
        path: `artifacts/catalog-search-${width}.png`,
        fullPage: true,
      });
      await page.goto("/games/mobile-legends");
      await page.screenshot({
        path: `artifacts/catalog-game-${width}.png`,
        fullPage: true,
      });
    }
  });
}

test("catalog keyboard, reduced motion, axe, text enlargement, and no-JS", async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/products");
  const search = page.getByRole("searchbox", { name: "Cari game atau produk" });
  await search.focus();
  await page.keyboard.type("roblox");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/q=roblox/);
  await page.getByLabel("Urutkan").selectOption("name");
  await page.getByRole("button", { name: "Terapkan" }).click();
  await expect(page).toHaveURL(/sort=name/);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBe(0);
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const noJs = await context.newPage();
  await noJs.goto("http://localhost:3200/products?q=ff");
  await expect(
    noJs.getByRole("link", { name: /Free Fire.*Lihat nominal/ }),
  ).toBeVisible();
  await noJs.goto("http://localhost:3200/games/free-fire");
  await expect(
    noJs.getByRole("heading", { name: "Pilih nominal" }),
  ).toBeVisible();
  await context.close();
});
