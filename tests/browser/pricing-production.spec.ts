import { expect, test } from "@playwright/test";

test("pricing workspace and mutation endpoint stay closed in production", async ({
  page,
  request,
}) => {
  const pageResponse = await page.goto("/dev/admin/pricing");
  expect(pageResponse?.status()).toBe(404);
  const api = await request.post("/api/dev/pricing", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: {
      action: "simulate",
      productId: "00000000-0000-4000-8000-000000000000",
      tierId: "00000000-0000-4000-8000-000000000000",
    },
  });
  expect(api.status()).toBe(404);
  const admin = await page.goto("/admin");
  expect(admin?.url()).toContain("/login?returnTo=%2Fadmin");
});
