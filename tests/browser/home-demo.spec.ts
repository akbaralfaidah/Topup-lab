import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("demo reads public catalog without internal fields", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Pilihan game di katalog" }),
  ).toBeVisible();
  for (const name of [
    "Mobile Legends",
    "Free Fire",
    "PUBG Mobile",
    "Roblox",
    "Valorant",
    "Genshin Impact",
  ]) {
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
  expect(await page.locator(".game-tile").count()).toBe(6);
  expect(await page.locator(".category-shortcut").count()).toBe(7);
  expect(await page.locator(".digital-row").count()).toBe(6);
  await expect(page.getByText("24 September 2026, 12.00 WIB")).toBeVisible();
  const html = await response!.text();
  expect(html).not.toMatch(
    /DEMO_ALPHA|providerCostIdr|costIdr|demo\.support@example\.invalid|topuplab_demo_[a-f0-9]{12}/,
  );
  for (const link of await page.locator("a[href]").all()) {
    const href = await link.getAttribute("href");
    expect(href).toMatch(/^\/|^#/);
  }
});

test("search supports typing, keyboard choice, empty state and clear", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Cari produk" });
  await search.fill("rob");
  await expect(page.getByRole("listbox")).toContainText("Roblox");
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page.getByRole("status")).toContainText("pratinjau");
  await page.getByRole("button", { name: "Hapus pencarian" }).click();
  await expect(search).toHaveValue("");
  await search.fill("tidak-ada-produk");
  await expect(
    page.getByText("Belum ada produk demo yang cocok.", { exact: false }),
  ).toBeVisible();
  await search.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
});

for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
  test(`demo responsive ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
    await expect(
      page.getByRole("combobox", { name: "Cari produk" }),
    ).toBeVisible();
    if (width === 390 || width === 768 || width === 1440) {
      await page.screenshot({
        path: `artifacts/home-demo-${width}-full.png`,
        fullPage: true,
      });
      if (width === 390 || width === 1440)
        await page.screenshot({ path: `artifacts/home-demo-${width}-top.png` });
      if (width === 390) {
        await page.locator(".flash-section").scrollIntoViewIfNeeded();
        await page.screenshot({ path: "artifacts/home-demo-390-mid.png" });
        await page.locator(".faq-section").scrollIntoViewIfNeeded();
        await page.screenshot({ path: "artifacts/home-demo-390-bottom.png" });
      }
    }
  });
}

test("demo accessibility and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("combobox", { name: "Cari produk" }).fill("free");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("demo remains readable at 200% text and without JavaScript", async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
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
  await noJs.goto("http://localhost:3200/");
  await expect(
    noJs.getByRole("heading", { name: "Pilihan game di katalog" }),
  ).toBeVisible();
  await expect(
    noJs.getByRole("heading", { name: "Mobile Legends" }),
  ).toBeVisible();
  await context.close();
});
