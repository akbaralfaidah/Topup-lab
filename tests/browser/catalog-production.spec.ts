import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("production catalog routes have a safe unavailable state", async ({
  page,
}) => {
  for (const path of ["/products", "/products?q=ml", "/games/mobile-legends"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByText("Katalog belum tersedia.")).toBeVisible();
    const html = await response!.text();
    expect(html).not.toMatch(
      /DEMO_ALPHA|providerCostIdr|costIdr|topuplab_demo_[a-f0-9]{12}|password|ECONNREFUSED/,
    );
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
  }
  await page.screenshot({
    path: "artifacts/catalog-unavailable-production.png",
    fullPage: true,
  });
});
