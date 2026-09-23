import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
  test(`customer shell fits ${width}px and its disclosure works`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Tempat baru untuktop up kamu.",
    );
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
    await page.getByRole("link", { name: "Info layanan" }).click();
    await expect(page).toHaveURL(/#ketersediaan$/);
    const disclosure = page.getByRole("button", {
      name: "Apakah sudah bisa bertransaksi?",
    });
    await disclosure.click();
    await expect(disclosure).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#availability-answer")).toBeVisible();
    await disclosure.click();
    await expect(page.locator("#availability-answer")).toBeHidden();
    await page.getByRole("link", { name: "TOPUPLAB, beranda" }).click();
    await expect(page).toHaveURL("/");
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `artifacts/shell-${width}.png`,
      fullPage: true,
    });
  });
}

test("keyboard navigation and reduced motion preserve interaction", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Lewati ke konten" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.keyboard.press("Tab");
  const disclosure = page.getByRole("button", {
    name: "Apakah sudah bisa bertransaksi?",
  });
  await expect(disclosure).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#availability-answer p")).toHaveCSS(
    "transform",
    "none",
  );
  await page.keyboard.press("Space");
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");
});

test("protected admin and unknown routes expose no operational content", async ({
  page,
  request,
}) => {
  const response = await request.get("/admin", {
    headers: { "x-role": "SUPER_ADMIN", cookie: "role=SUPER_ADMIN" },
  });
  expect(response.status()).toBe(404);
  await page.goto("/missing-page");
  await expect(
    page.getByRole("heading", { name: "Halaman tidak tersedia." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Kembali ke beranda" }).click();
  await expect(page).toHaveURL("/");
});

test("health is uncached and server replaces supplied correlation IDs", async ({
  request,
}) => {
  const response = await request.get("/api/health", {
    headers: { "x-request-id": "untrusted" },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.requestId).toMatch(/^[a-f0-9-]{36}$/);
  expect(response.headers()["x-request-id"]).toBe(body.requestId);
  expect(response.headers()["cache-control"]).toBe("no-store");
});

test("shell and error page pass automated accessibility checks", async ({
  page,
}) => {
  for (const path of ["/", "/missing-page"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  }
});

test("text enlargement preserves layout and the disclosure target remains touch-sized", async ({
  page,
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
  const button = page.getByRole("button", {
    name: "Apakah sudah bisa bertransaksi?",
  });
  const box = await button.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);
  await button.click();
  await expect(page.locator("#availability-answer")).toBeVisible();
});

test("essential availability information is readable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/");
  await expect(
    page.getByRole("heading", { name: "Layanan belum dibuka." }),
  ).toBeVisible();
  await context.close();
});
