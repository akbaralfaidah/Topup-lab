import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { Client } from "pg";

const origin = "http://localhost:3200";
const draft = {
  id: null,
  version: null,
  name: "Aturan uji Phase 8",
  scope: "GLOBAL",
  targetId: null,
  tierId: null,
  fixedMarkupIdr: "2500",
  percentage: "7.5",
  minimumMarginIdr: "500",
  priority: 777,
  startsAt: null,
  endsAt: null,
  active: true,
};

test("workspace simulates, previews, creates, edits and audits a demo rule", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto("/dev/admin/pricing");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Aturan harga" }),
  ).toBeVisible();
  await page.waitForTimeout(800);
  await page
    .getByRole("combobox", { name: "Produk" })
    .selectOption({ label: "Mobile Legends 12 Diamonds" });
  await page.getByRole("button", { name: "Hitung harga" }).click();
  await expect(page.locator(".pricing-final strong")).toHaveText("Rp4.588");
  await expect(
    page.getByRole("heading", { name: "Bandingkan tier" }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/pricing-1440-simulator.png",
    fullPage: true,
  });

  const name = `Aturan uji Phase 8 ${Date.now()}`;
  await page.getByLabel("Nama aturan").fill(name);
  await page.getByLabel("Markup tetap (Rp)").fill("2500");
  await page.getByLabel("Markup persentase (%)").fill("7.5");
  await page.getByLabel("Margin minimum (Rp)").fill("500");
  await page.getByLabel("Prioritas").fill("777");
  await page.getByLabel("Aturan aktif").check();
  await page.getByRole("button", { name: "Pratinjau dampak" }).click();
  await expect(
    page.getByRole("heading", { name: "Dampak sebelum simpan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Simpan aturan" }),
  ).toBeEnabled();
  await page.screenshot({
    path: "artifacts/pricing-1440-builder.png",
    fullPage: true,
  });

  const noOrigin = await request.post("/api/dev/pricing", {
    data: { action: "save", rule: draft },
  });
  expect(noOrigin.status()).toBe(403);
  const foreignOrigin = await request.post("/api/dev/pricing", {
    headers: { Origin: "https://example.invalid" },
    data: { action: "save", rule: draft },
  });
  expect(foreignOrigin.status()).toBe(403);
  const loopbackAlias = await request.post(
    "http://127.0.0.1:3200/api/dev/pricing",
    {
      headers: { Origin: "http://127.0.0.1:3200" },
      data: {},
    },
  );
  expect(loopbackAlias.status()).toBe(400);
  const oversized = await request.post("/api/dev/pricing", {
    headers: { Origin: origin },
    data: { action: "save", rule: { ...draft, name: "x".repeat(5000) } },
  });
  expect(oversized.status()).toBe(413);
  const invalid = await request.post("/api/dev/pricing", {
    headers: { Origin: origin },
    data: { action: "save", rule: { ...draft, fixedMarkupIdr: "1e3" } },
  });
  expect(invalid.status()).toBe(422);

  const preview = await request.post("/api/dev/pricing", {
    headers: { Origin: origin },
    data: { action: "preview", rule: draft },
  });
  expect(preview.status()).toBe(200);
  expect((await preview.json()).preview.affectedCount).toBe(43);
  await page.getByRole("button", { name: "Simpan aturan" }).click();
  await expect(
    page.getByRole("button", { name: new RegExp(name) }),
  ).toBeVisible();
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const saved = await client.query(
      "SELECT id, xmin::text AS version, fixed_markup_idr::text AS fixed FROM pricing_rules WHERE name = $1",
      [name],
    );
    expect(saved.rows[0]?.fixed).toBe("2500");
    const id = saved.rows[0]?.id as string;
    const version = saved.rows[0]?.version as string;
    const update = {
      ...draft,
      name,
      id,
      version,
      fixedMarkupIdr: "2600",
      active: false,
    };
    const edited = await request.post("/api/dev/pricing", {
      headers: { Origin: origin },
      data: { action: "save", rule: update },
    });
    expect(edited.status()).toBe(200);
    const stale = await request.post("/api/dev/pricing", {
      headers: { Origin: origin },
      data: { action: "save", rule: update },
    });
    expect(stale.status()).toBe(409);
    const financial = await client.query(
      "SELECT (SELECT count(*) FROM orders) AS orders, (SELECT count(*) FROM price_snapshots) AS snapshots, (SELECT count(*) FROM payments) AS payments, (SELECT count(*) FROM provider_attempts) AS attempts",
    );
    expect(financial.rows[0]).toMatchObject({
      orders: "0",
      snapshots: "0",
      payments: "0",
      attempts: "0",
    });
    const audit = await client.query(
      "SELECT count(*)::int AS total FROM audit_logs WHERE entity_id = $1 AND origin = 'SYSTEM' AND actor_id IS NULL",
      [id],
    );
    expect(audit.rows[0]?.total).toBe(2);
  } finally {
    await client.end();
  }
  await page.reload();
  await expect(
    page.getByRole("button", { name: new RegExp(name) }),
  ).toBeVisible();
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page.getByLabel("Markup tetap (Rp)")).toHaveValue("2600");
});

test("conflicting active rules are rejected and public quotes retain their price", async ({
  request,
}) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const next = await client.query(
    "SELECT max(priority)::int + 1 AS priority FROM pricing_rules",
  );
  await client.end();
  const priority = next.rows[0]?.priority as number;
  const first = await request.post("/api/dev/pricing", {
    headers: { Origin: origin },
    data: {
      action: "save",
      rule: { ...draft, name: "Aturan benturan A", priority },
    },
  });
  expect(first.status()).toBe(200);
  const second = await request.post("/api/dev/pricing", {
    headers: { Origin: origin },
    data: {
      action: "save",
      rule: { ...draft, name: "Aturan benturan B", priority },
    },
  });
  expect(second.status()).toBe(409);
  const quote = await request.post("/api/demo/quote", {
    data: { productSlug: "mobile-legends-12", payment: "QRIS" },
  });
  expect(quote.status()).toBe(200);
  const payload = await quote.json();
  expect(payload.quote.priceIdr).toBe("4588");
  expect(JSON.stringify(payload)).not.toMatch(
    /Aturan benturan|providerCostIdr|markupBps|minimumMarginIdr|providerId|pricingRuleId/,
  );
  const client2 = new Client({ connectionString: process.env.DATABASE_URL });
  await client2.connect();
  const ids = await client2.query(
    "SELECT p.id AS product_id, t.id AS tier_id FROM products p CROSS JOIN membership_tiers t WHERE p.slug = 'mobile-legends-12' AND t.code = 'PUBLIC'",
  );
  await client2.end();
  const internal = await request.post("/api/dev/pricing", {
    headers: { Origin: origin },
    data: {
      action: "simulate",
      productId: ids.rows[0].product_id,
      tierId: ids.rows[0].tier_id,
    },
  });
  expect(internal.status()).toBe(200);
  const traced = await internal.json();
  expect(traced.simulation.chosen.costIdr).toBe("3500");
  expect(traced.simulation.chosen.price.commercialRuleName).toBe(
    "Demo: kategori game",
  );
  expect(traced.simulation.chosen.price.sellingPriceIdr).toBe("4588");
});

test("provider floor reaches the simulator and public quote, then can be disabled", async ({
  request,
}) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const provider = await client.query(
    "SELECT id FROM providers WHERE code = 'DEMO_ALPHA'",
  );
  const providerId = provider.rows[0]?.id as string;
  const rule = {
    ...draft,
    name: `Batas penyedia uji ${Date.now()}`,
    scope: "PROVIDER",
    targetId: providerId,
    fixedMarkupIdr: "3000",
    percentage: "0",
    minimumMarginIdr: "0",
    priority: 700,
    active: true,
  };
  let id: string | null = null;
  try {
    const created = await request.post("/api/dev/pricing", {
      headers: { Origin: origin },
      data: { action: "save", rule },
    });
    expect(created.status()).toBe(200);
    id = (await created.json()).id;
    const ids = await client.query(
      "SELECT p.id AS product_id, t.id AS tier_id FROM products p CROSS JOIN membership_tiers t WHERE p.slug = 'mobile-legends-12' AND t.code = 'PUBLIC'",
    );
    const simulation = await request.post("/api/dev/pricing", {
      headers: { Origin: origin },
      data: {
        action: "simulate",
        productId: ids.rows[0].product_id,
        tierId: ids.rows[0].tier_id,
      },
    });
    const traced = await simulation.json();
    expect(traced.simulation.chosen.price.providerFloorIdr).toBe("6500");
    expect(traced.simulation.chosen.price.sellingPriceIdr).toBe("6500");
    const quote = await request.post("/api/demo/quote", {
      data: { productSlug: "mobile-legends-12", payment: "QRIS" },
    });
    expect((await quote.json()).quote.priceIdr).toBe("6500");
  } finally {
    if (id) {
      const current = await client.query(
        "SELECT xmin::text AS version FROM pricing_rules WHERE id = $1",
        [id],
      );
      const disabled = await request.post("/api/dev/pricing", {
        headers: { Origin: origin },
        data: {
          action: "save",
          rule: {
            ...rule,
            id,
            version: current.rows[0]?.version,
            active: false,
          },
        },
      });
      expect(disabled.status()).toBe(200);
    }
    await client.end();
  }
  const restored = await request.post("/api/demo/quote", {
    data: { productSlug: "mobile-legends-12", payment: "QRIS" },
  });
  expect((await restored.json()).quote.priceIdr).toBe("4588");
});

test("builder shows a clear conflict before saving", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dev/admin/pricing");
  await page.waitForTimeout(800);
  await page.getByLabel("Nama aturan").fill("Aturan benturan visual");
  await page
    .getByRole("combobox", { name: "Tier", exact: true })
    .first()
    .selectOption({ label: "Public" });
  await page.getByLabel("Aturan aktif").check();
  await page.getByRole("button", { name: "Pratinjau dampak" }).click();
  await expect(page.locator(".pricing-message[role='alert']")).toContainText(
    "sudah ada",
  );
  await expect(
    page.getByRole("button", { name: "Simpan aturan" }),
  ).toBeDisabled();
  await page.screenshot({
    path: "artifacts/pricing-1440-conflict.png",
    fullPage: true,
  });
});

for (const width of [320, 390, 768, 1440]) {
  test(`pricing workspace reflows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/dev/admin/pricing");
    await expect(
      page.getByRole("heading", { name: "Daftar aturan" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Buat aturan" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if ([390, 768, 1440].includes(width))
      await page.screenshot({
        path: `artifacts/pricing-${width}-workspace.png`,
        fullPage: true,
      });
    if (width === 390) {
      await page.waitForTimeout(800);
      await page.getByLabel("Nama aturan").fill("Contoh rancangan harga");
      await page.getByLabel("Markup tetap (Rp)").fill("1200");
      await page.screenshot({
        path: "artifacts/pricing-390-builder.png",
        fullPage: true,
      });
      await page
        .getByRole("combobox", { name: "Produk" })
        .selectOption({ label: "Mobile Legends 12 Diamonds" });
      await page.getByRole("button", { name: "Hitung harga" }).click();
      await expect(page.locator(".pricing-final strong")).toHaveText("Rp4.588");
      await page.screenshot({
        path: "artifacts/pricing-390-simulator.png",
        fullPage: true,
      });
    }
  });
}

test("pricing workspace passes axe, reduced motion and 200% text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/admin/pricing");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
