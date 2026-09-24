import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const forbidden =
  /DEMO_ALPHA|DEMO_BETA|providerCostIdr|costIdr|minimumMarginIdr|markupBps|pricingRuleId|topuplab_demo_[a-f0-9]{12}/;

test("game preparation validates target, updates fee, and ends at demo review", async ({
  page,
  request,
}) => {
  const response = await page.goto("/games/mobile-legends");
  expect(response?.status()).toBe(200);
  expect(await response!.text()).not.toMatch(forbidden);
  await expect(
    page.getByRole("heading", { name: "Masukkan tujuan" }),
  ).toBeVisible();
  await page.getByRole("radio", { name: /12 Diamonds/ }).check();
  await expect(page.getByRole("radio", { name: /QRIS/ })).toBeEnabled();
  await page.getByRole("radio", { name: /QRIS/ }).check();
  await expect(page.locator(".prep-summary .commerce-total dd")).toContainText(
    "Rp",
  );
  await page.getByRole("button", { name: "Pratinjau pesanan" }).click();
  await expect(page.getByText("ID pengguna wajib diisi.")).toBeVisible();
  await page.getByLabel("ID pengguna").fill("12345678");
  await page.getByLabel("ID zona").fill("1234");
  await page.getByRole("radio", { name: /Virtual Account/ }).check();
  await expect(page.locator(".prep-summary")).toContainText("Rp2.500");
  await page.getByRole("button", { name: "Pratinjau pesanan" }).click();
  await expect(page.locator(".prep-review")).toContainText("••••5678");
  await expect(page.locator(".prep-review")).toContainText("Virtual Account");
  await expect(page.locator(".prep-review")).toContainText(
    "Checkout transaksi akan diaktifkan",
  );
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  expect(await page.content()).not.toMatch(forbidden);
  const quote = await request.post("/api/demo/quote", {
    data: {
      productSlug: "mobile-legends-12",
      payment: "VA",
      target: { user_id: "12345678", zone_id: "1234" },
    },
  });
  expect(quote.status()).toBe(200);
  const json = await quote.json();
  expect(json.state).toBe("ready");
  expect(json.quote).toMatchObject({
    priceIdr: "4588",
    feeIdr: "2500",
    totalIdr: "7088",
  });
  expect(JSON.stringify(json)).not.toMatch(forbidden);
  const productRule = await request.post("/api/demo/quote", {
    data: { productSlug: "mobile-legends-86", payment: "QRIS" },
  });
  expect(productRule.status()).toBe(200);
  expect((await productRule.json()).quote.priceIdr).toBe("23340");
  const unavailable = await request.post("/api/demo/quote", {
    data: { productSlug: "mobile-legends-5", payment: "QRIS" },
  });
  expect(unavailable.status()).toBe(409);
  expect(await unavailable.json()).toEqual({ state: "product_unavailable" });
  const invalid = await request.post("/api/demo/quote", {
    data: {
      productSlug: "mobile-legends-12",
      payment: "VA",
      target: { user_id: "12345678", zone_id: "1234", password: "secret" },
    },
  });
  expect(invalid.status()).toBe(422);
  expect(JSON.stringify(await invalid.json())).not.toContain("secret");
  await page.reload();
  await expect(page.getByLabel("ID pengguna")).toHaveValue("");
  await expect(page.locator(".prep-review")).toHaveCount(0);
});

test("unavailable denomination cannot progress and non-game product shares the flow", async ({
  page,
}) => {
  await page.goto("/games/mobile-legends");
  await expect(page.getByRole("radio", { name: /5 Diamonds/ })).toBeDisabled();
  await page.goto("/products/pulsa-demo-10000");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Pulsa Demo",
  );
  await expect(page.getByLabel("Nomor ponsel Indonesia (+62)")).toBeVisible();
  await expect(page.getByRole("radio", { name: /10000 IDR/ })).toBeEnabled();
});

for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
  test(`preparation layout ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/games/mobile-legends");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
    await expect(
      page.getByRole("heading", { name: "Masukkan tujuan" }),
    ).toBeVisible();
    if (width === 390 || width === 768 || width === 1440) {
      await page.screenshot({
        path: `artifacts/preparation-${width}-default.png`,
        fullPage: true,
      });
      if (width === 390 || width === 1440) {
        if (width === 390) {
          await page.screenshot({ path: "artifacts/preparation-390-top.png" });
          await page.locator(".game-denominations").scrollIntoViewIfNeeded();
          await page.screenshot({
            path: "artifacts/preparation-390-denominations.png",
          });
        }
        await page.getByRole("radio", { name: /12 Diamonds/ }).check();
        await page.getByRole("radio", { name: /QRIS/ }).check();
        await expect(
          page.locator(width === 390 ? ".prep-mobile-bar" : ".prep-summary"),
        ).toContainText("Rp");
        await page.screenshot({
          path: `artifacts/preparation-${width}-selected.png`,
          fullPage: true,
        });
        if (width === 390) {
          await page.locator(".prep-payments").scrollIntoViewIfNeeded();
          await page.screenshot({
            path: "artifacts/preparation-390-payment.png",
          });
        }
        await page.getByLabel("ID pengguna").fill("12345678");
        await page.getByLabel("ID zona").fill("1234");
        await page.getByRole("button", { name: "Pratinjau pesanan" }).click();
        await expect(page.locator(".prep-review")).toBeVisible();
        await page.screenshot({
          path: `artifacts/preparation-${width}-review.png`,
          fullPage: true,
        });
        if (width === 390)
          await page.screenshot({
            path: "artifacts/preparation-390-review-viewport.png",
          });
      }
    }
  });
}

test("keyboard, axe, reduced motion, 200% text, and no-JS product content", async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/games/free-fire");
  const option = page.getByRole("radio", { name: /20 Diamonds/ });
  await option.focus();
  await page.keyboard.press("Space");
  await expect(option).toBeChecked();
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
  await noJs.goto("http://localhost:3200/games/free-fire");
  await expect(
    noJs.getByRole("heading", { name: "Masukkan tujuan" }),
  ).toBeVisible();
  await expect(noJs.getByRole("radio", { name: /20 Diamonds/ })).toBeVisible();
  await context.close();
});
