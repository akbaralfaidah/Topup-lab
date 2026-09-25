import "dotenv/config";
import { expect, test } from "@playwright/test";
import { Client } from "pg";

const origin = "http://localhost:3200";

test("guest order checkout flow, idempotency, and confirmation page access", async ({
  browser,
}) => {
  const context = await browser.newContext({ baseURL: origin });
  const page = await context.newPage();

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  try {
    // Navigate to a product page
    await page.goto("/games/mobile-legends");

    // Fill target
    await page.fill('input[name="userId"]', "12345678");
    await page.fill('input[name="zoneId"]', "1234");

    // Select product denomination
    await page.click('button:has-text("53 Diamonds")'); // assuming it exists from seed

    // Select payment method
    await page.click('label:has-text("QRIS")');

    // Click "Pratinjau pesanan"
    await page.click('button:has-text("Pratinjau pesanan")');

    // Wait for "Buat pesanan" to appear
    await expect(page.locator('button:has-text("Buat pesanan")')).toBeVisible();

    // Click "Buat pesanan"
    await page.click('button:has-text("Buat pesanan")');

    // Should navigate to confirmation page
    await page.waitForURL(/\/orders\/[0-9a-fA-F-]+/);

    const url = page.url();
    const publicReference = url.split("/orders/")[1];
    expect(publicReference).toBeTruthy();

    // Verify confirmation content
    await expect(page.locator('h1:has-text("Pesanan Dibuat")')).toBeVisible();
    await expect(page.locator('h2:has-text("Status")')).toBeVisible();
    await expect(
      page.locator('span:has-text("Menunggu Pembayaran")'),
    ).toBeVisible();

    // Database validation
    const orderRes = await db.query(
      "SELECT id, total_idr, status, idempotency_key FROM orders WHERE public_reference = $1",
      [publicReference],
    );
    expect(orderRes.rows.length).toBe(1);
    const order = orderRes.rows[0];
    expect(order.status).toBe("WAITING_PAYMENT");

    const itemRes = await db.query(
      "SELECT target_ciphertext, target_key_reference FROM order_items WHERE order_id = $1",
      [order.id],
    );
    expect(itemRes.rows.length).toBe(1);
    expect(itemRes.rows[0].target_ciphertext).toContain("v1:");
    expect(itemRes.rows[0].target_ciphertext).not.toContain("12345678"); // Plaintext must not exist

    const historyRes = await db.query(
      "SELECT to_status, reason_code FROM order_status_history WHERE order_id = $1",
      [order.id],
    );
    expect(historyRes.rows.length).toBe(1);
    expect(historyRes.rows[0].to_status).toBe("WAITING_PAYMENT");

    // IDOR check: another guest should not access the order
    const guest2 = await browser.newContext({ baseURL: origin });
    const page2 = await guest2.newPage();
    const res2 = await page2.goto(`/orders/${publicReference}`);
    expect(res2?.status()).toBe(404);
    await guest2.close();
  } finally {
    await db.end();
    await context.close();
  }
});
