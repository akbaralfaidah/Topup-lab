import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { Client } from "pg";

const origin = "http://localhost:3200";
const password = "correct horse battery staples 2026";
const unique = () => `phase9.${crypto.randomUUID()}@example.invalid`;
const draft = {
  id: null,
  version: null,
  name: `Phase 9 audit ${Date.now()}`,
  scope: "GLOBAL",
  targetId: null,
  tierId: null,
  fixedMarkupIdr: "100",
  percentage: "1",
  minimumMarginIdr: "500",
  priority: 8888,
  startsAt: null,
  endsAt: null,
  active: false,
};

async function register(
  context: Awaited<
    ReturnType<import("@playwright/test").Browser["newContext"]>
  >,
  email: string,
) {
  return context.request.post("/api/auth/register", {
    headers: { Origin: origin },
    data: { email, password },
  });
}

test("registration, session lifecycle, role boundaries and real pricing mutation", async ({
  browser,
  request,
}) => {
  const guest = await browser.newContext({ baseURL: origin });
  const customer = await browser.newContext({ baseURL: origin });
  const limited = await browser.newContext({ baseURL: origin });
  const admin = await browser.newContext({ baseURL: origin });
  const reseller = await browser.newContext({ baseURL: origin });
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    expect((await guest.request.get("/account")).url()).toContain(
      "/login?returnTo=%2Faccount",
    );
    expect((await guest.request.get("/admin/pricing")).url()).toContain(
      "/login?returnTo=%2Fadmin%2Fpricing",
    );
    expect(
      (
        await guest.request.post("/api/admin/pricing", {
          headers: { Origin: origin },
          data: { action: "save", rule: draft },
        })
      ).status(),
    ).toBe(401);
    expect((await request.get("/products")).status()).toBe(200);

    const customerEmail = unique();
    const created = await register(customer, customerEmail.toUpperCase());
    expect(created.status()).toBe(201);
    expect(created.headers()["set-cookie"]).toMatch(/HttpOnly.*SameSite=lax/i);
    expect((await register(guest, customerEmail)).status()).toBe(409);
    const customerRow = await db.query(
      "SELECT u.id, u.email_normalized, u.email_verified_at, c.password_hash, p.membership_tier_id FROM users u JOIN password_credentials c ON c.user_id=u.id JOIN customer_profiles p ON p.user_id=u.id WHERE u.email_normalized=$1",
      [customerEmail],
    );
    const customerId = customerRow.rows[0]?.id as string;
    expect(customerRow.rows[0]?.email_normalized).toBe(customerEmail);
    expect(customerRow.rows[0]?.email_verified_at).toBeNull();
    expect(customerRow.rows[0]?.password_hash).toMatch(/^\$argon2id\$/);
    expect(
      (
        await db.query(
          "SELECT r.code FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=$1",
          [customerId],
        )
      ).rows.map((row) => row.code),
    ).toContain("CUSTOMER");
    const bearer = (await customer.cookies()).find(
      (cookie) => cookie.name === "topuplab_session",
    )?.value;
    expect(bearer).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const sessionRow = await db.query(
      "SELECT token_digest, expires_at, revoked_at FROM sessions WHERE user_id=$1",
      [customerId],
    );
    expect(sessionRow.rows[0]?.token_digest).not.toBe(bearer);
    expect(sessionRow.rows[0]?.token_digest).toMatch(/^[a-f0-9]{64}$/);
    expect((await customer.request.get("/account")).status()).toBe(200);
    expect((await customer.request.get("/admin")).status()).toBe(404);
    expect(
      (
        await customer.request.post("/api/admin/pricing", {
          headers: { Origin: origin },
          data: { action: "save", rule: draft },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await guest.request.post("/api/auth/login", {
          headers: { Origin: origin },
          data: { email: customerEmail, password: "wrong" },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await guest.request.post("/api/auth/login", {
          headers: { Origin: origin },
          data: { email: unique(), password: "wrong" },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await guest.request.post("/api/auth/login", {
          data: { email: customerEmail, password },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await guest.request.post("/api/auth/login", {
          headers: { Origin: "https://evil.invalid" },
          data: { email: customerEmail, password },
        })
      ).status(),
    ).toBe(403);

    const limitedEmail = unique();
    expect((await register(limited, limitedEmail)).status()).toBe(201);
    const limitedId = (
      await db.query("SELECT id FROM users WHERE email_normalized=$1", [
        limitedEmail,
      ])
    ).rows[0]?.id;
    await db.query(
      "INSERT INTO roles(code,name,active) VALUES('LIMITED_ADMIN','Limited admin',true) ON CONFLICT(code) DO NOTHING",
    );
    await db.query(
      "INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='LIMITED_ADMIN' AND p.code='admin.access' ON CONFLICT DO NOTHING",
    );
    await db.query(
      "INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE code='LIMITED_ADMIN' ON CONFLICT DO NOTHING",
      [limitedId],
    );
    expect((await limited.request.get("/admin")).status()).toBe(200);
    expect((await limited.request.get("/admin/pricing")).status()).toBe(404);
    expect(
      (
        await limited.request.post("/api/admin/pricing", {
          headers: { Origin: origin },
          data: { action: "save", rule: draft },
        })
      ).status(),
    ).toBe(403);

    const resellerEmail = unique();
    expect((await register(reseller, resellerEmail)).status()).toBe(201);
    const resellerId = (
      await db.query("SELECT id FROM users WHERE email_normalized=$1", [
        resellerEmail,
      ])
    ).rows[0]?.id;
    await db.query(
      "INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE code='RESELLER' ON CONFLICT DO NOTHING",
      [resellerId],
    );
    expect((await reseller.request.get("/admin")).status()).toBe(404);

    const adminEmail = unique();
    expect((await register(admin, adminEmail)).status()).toBe(201);
    const adminId = (
      await db.query("SELECT id FROM users WHERE email_normalized=$1", [
        adminEmail,
      ])
    ).rows[0]?.id;
    await db.query(
      "INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE code='ADMIN' ON CONFLICT DO NOTHING",
      [adminId],
    );
    expect((await admin.request.get("/admin/pricing")).status()).toBe(200);
    const saveWithoutOrigin = await admin.request.post("/api/admin/pricing", {
      data: { action: "save", rule: draft },
    });
    expect(saveWithoutOrigin.status()).toBe(403);
    expect(
      (
        await admin.request.post("/api/admin/pricing", {
          headers: { Origin: "https://evil.invalid" },
          data: { action: "save", rule: draft },
        })
      ).status(),
    ).toBe(403);
    const saved = await admin.request.post("/api/admin/pricing", {
      headers: { Origin: origin },
      data: { action: "save", rule: draft },
    });
    expect(saved.status()).toBe(200);
    const ruleId = (await saved.json()).id as string;
    const audit = await db.query(
      "SELECT origin,actor_id FROM audit_logs WHERE entity_id=$1 ORDER BY created_at DESC LIMIT 1",
      [ruleId],
    );
    expect(audit.rows[0]).toMatchObject({ origin: "ADMIN", actor_id: adminId });
    const version = (
      await db.query(
        "SELECT xmin::text AS version FROM pricing_rules WHERE id=$1",
        [ruleId],
      )
    ).rows[0]?.version;
    const update = {
      ...draft,
      id: ruleId,
      version,
      name: `${draft.name} updated`,
    };
    expect(
      (
        await admin.request.post("/api/admin/pricing", {
          headers: { Origin: origin },
          data: { action: "save", rule: update },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await admin.request.post("/api/admin/pricing", {
          headers: { Origin: origin },
          data: { action: "save", rule: update },
        })
      ).status(),
    ).toBe(409);
    const publicTier = (
      await db.query("SELECT id FROM membership_tiers WHERE code='PUBLIC'")
    ).rows[0]?.id;
    const conflict = {
      ...draft,
      name: `${draft.name} conflict`,
      tierId: publicTier,
      priority: 100,
      active: true,
    };
    expect(
      (
        await admin.request.post("/api/admin/pricing", {
          headers: { Origin: origin },
          data: { action: "save", rule: conflict },
        })
      ).status(),
    ).toBe(409);

    await db.query("UPDATE users SET status='SUSPENDED' WHERE id=$1", [
      customerId,
    ]);
    expect((await customer.request.get("/account")).url()).toContain(
      "/login?returnTo=%2Faccount",
    );
    expect(
      (
        await guest.request.post("/api/auth/login", {
          headers: { Origin: origin },
          data: { email: customerEmail, password },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await admin.request.post("/api/auth/logout", {
          headers: { Origin: origin },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await admin.request.post("/api/auth/logout", {
          headers: { Origin: origin },
        })
      ).status(),
    ).toBe(200);
    expect((await admin.request.get("/admin")).url()).toContain(
      "/login?returnTo=%2Fadmin",
    );
    const financial = await db.query(
      "SELECT (SELECT count(*) FROM orders) orders,(SELECT count(*) FROM payments) payments,(SELECT count(*) FROM provider_attempts) attempts",
    );
    expect(financial.rows[0]).toMatchObject({
      orders: "0",
      payments: "0",
      attempts: "0",
    });
  } finally {
    await db.end();
    await Promise.all([
      guest.close(),
      customer.close(),
      limited.close(),
      admin.close(),
      reseller.close(),
    ]);
  }
});

test("auth forms and account reflow, remain accessible, and respect reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/login", "/register"]) {
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if ((width === 390 || width === 1440) && route === "/login")
        await page.screenshot({
          path: `artifacts/auth-login-${width}.png`,
          fullPage: true,
        });
      if ((width === 390 || width === 1440) && route === "/register")
        await page.screenshot({
          path: `artifacts/auth-register-${width}.png`,
          fullPage: true,
        });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");
  const toggle = page.getByRole("button", { name: "Tampilkan kata sandi" });
  await toggle.click();
  await expect(
    page.getByRole("button", { name: "Sembunyikan kata sandi" }),
  ).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
