import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
  test(`homepage fits ${width}px and explains unavailable catalog`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Top up yang dicari",
    );
    await expect(page.getByText("Katalog belum tersedia.")).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
    if (width <= 850) {
      await page.locator(".mobile-nav summary").click();
      await expect(
        page
          .getByRole("navigation", { name: "Navigasi seluler" })
          .getByRole("link", { name: "Bantuan" }),
      ).toBeVisible();
    }
    await page
      .getByRole("navigation", {
        name: width <= 850 ? "Navigasi seluler" : "Navigasi utama",
      })
      .getByRole("link", { name: "Bantuan" })
      .click();
    await expect(page).toHaveURL(/#bantuan$/);
    const faq = page.getByRole("button", {
      name: "Apakah sudah bisa membeli?",
    });
    await faq.click();
    await expect(faq).toHaveAttribute("aria-expanded", "true");
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `artifacts/home-unavailable-${width}.png`,
      fullPage: true,
    });
  });
}

test("keyboard and reduced motion retain access to the homepage", async ({
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
  const faq = page.getByRole("button", { name: "Apakah sudah bisa membeli?" });
  await faq.focus();
  await page.keyboard.press("Enter");
  await expect(faq).toHaveAttribute("aria-expanded", "true");
});

test("protected admin redirects guests to login and unknown routes expose no operational content", async ({
  page,
  request,
}) => {
  const response = await request.get("/admin", {
    headers: { "x-role": "SUPER_ADMIN", cookie: "role=SUPER_ADMIN" },
  });
  expect(response.url()).toContain("/login?returnTo=%2Fadmin");
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

test("homepage and error page pass automated accessibility checks", async ({
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

test("text enlargement preserves layout and FAQ touch target", async ({
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
  const faq = page.getByRole("button", { name: "Apakah sudah bisa membeli?" });
  const box = await faq.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await faq.click();
  await expect(faq).toHaveAttribute("aria-expanded", "true");
});

test("essential availability is readable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/");
  await expect(page.getByText("Katalog belum tersedia.")).toBeVisible();
  await context.close();
});
