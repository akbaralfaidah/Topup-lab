import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const lab = "http://127.0.0.1:3100/dev/design-system";
test("buttons expose hover, active and keyboard focus; tooltip is keyboard accessible", async ({
  page,
}) => {
  await page.goto(lab);
  const button = page.getByRole("button", {
    name: "Coba tindakan",
    exact: true,
  });
  const normal = await button.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await button.hover();
  await expect(button).not.toHaveCSS("background-color", normal);
  const hover = await button.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await page.mouse.down();
  await expect(button).not.toHaveCSS("background-color", hover);
  await page.mouse.up();
  await page.keyboard.press("Tab");
  await button.focus();
  await expect(button).toHaveCSS("outline-style", "solid");
  const precedingControl = page.getByRole("button", {
    name: "Buka popover",
    exact: true,
  });
  await precedingControl.scrollIntoViewIfNeeded();
  await precedingControl.focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Bantuan komponen", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
});

test("Design Lab is closed by default in production and always closed in live mode", async ({
  request,
}) => {
  for (const base of ["http://127.0.0.1:3000", "http://127.0.0.1:3102"]) {
    const response = await request.get(
      `${base}/dev/design-system?enabled=true`,
      { headers: { "x-design-lab-enabled": "true" } },
    );
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain("Khusus pengembangan / demo");
  }
  expect((await request.get(lab)).status()).toBe(200);
});

for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
  test(`Design Lab reflows at ${width}px including overlays`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(lab);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
    const undersizedTargets = await page
      .locator(
        "button:not(:disabled), .lab-navigation a, .ui-choice, .commerce-denomination, .commerce-payment",
      )
      .evaluateAll((elements) =>
        elements
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              (rect.width < 44 || rect.height < 44)
            );
          })
          .map((element) => element.textContent),
      );
    expect(undersizedTargets).toEqual([]);
    await page.screenshot({
      path: `artifacts/phase-2/lab-${width}.png`,
      fullPage: true,
    });
    for (const trigger of ["Buka dialog", "Buka drawer", "Buka bottom sheet"]) {
      const button = page.getByRole("button", { name: trigger, exact: true });
      await button.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveCSS("opacity", "1");
      await expect(dialog.getByLabel("Nama tampilan contoh")).toBeVisible();
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      ).toBe(0);
      if (trigger === "Buka drawer")
        await page.screenshot({
          path: `artifacts/phase-2/drawer-${width}.png`,
        });
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(button).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
}

test("fields, choice controls, loading, pagination, commerce specimens and toast work", async ({
  page,
}) => {
  await page.goto(lab);
  await page.getByRole("button", { name: "Periksa contoh" }).click();
  const input = page.getByLabel("Kode contoh");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription(/Masukkan kode contoh/);
  await input.fill("DEMO-001");
  await page.getByRole("button", { name: "Periksa contoh" }).click();
  await expect(
    page.getByText("Isian valid. Tidak ada data yang dikirim."),
  ).toBeVisible();
  await page.getByLabel("Kategori contoh").selectOption("voucher");
  await page
    .getByLabel("Saya memahami ini hanya demonstrasi komponen.")
    .check();
  await page.getByRole("radio", { name: "Ringkas", exact: true }).check();
  const toggle = page.getByRole("switch", { name: "Tampilkan bantuan" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(page.getByLabel("Input tidak tersedia")).toBeDisabled();
  await page.getByRole("button", { name: "Mulai contoh memuat" }).click();
  await expect(
    page.getByRole("button", { name: "Memuat contoh…" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Selesaikan contoh", exact: true })
    .click();
  await page.getByRole("button", { name: "Halaman berikutnya" }).click();
  await expect(
    page.getByRole("cell", { name: "Konfirmasi singkat" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Halaman sebelumnya" }).click();
  await page.getByRole("radio", { name: /10 kredit demo/ }).check();
  await expect(
    page.getByRole("radio", { name: /10 kredit demo/ }),
  ).toBeChecked();
  await page.getByRole("radio", { name: /Metode demo lain/ }).check();
  await page.getByLabel("Cari contoh produk").fill("tidak cocok");
  await page.getByRole("button", { name: "Cari", exact: true }).click();
  await expect(page.getByText(/Tidak ada contoh yang cocok/)).toBeVisible();
  await page
    .getByRole("button", { name: "Tinjau contoh", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Pemberitahuan" }),
  ).toContainText("Tidak ada pesanan dibuat");
  await page.getByRole("button", { name: "Tutup pemberitahuan" }).click();
  await expect(
    page.getByRole("button", { name: "Tutup pemberitahuan" }),
  ).toBeHidden();
});

test("keyboard focus is trapped and returned; menus, tabs and accordion are operable", async ({
  page,
}) => {
  await page.goto(lab);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.locator("#lab-main")).toBeFocused();
  const trigger = page.getByRole("button", {
    name: "Buka dialog",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press(i % 2 ? "Shift+Tab" : "Tab");
    expect(
      await page
        .getByRole("dialog")
        .evaluate((element) => element.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "Tindakan", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("menuitem", { name: "Lihat keterangan" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitem", { name: "Atur ulang contoh" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("region", { name: "Pemberitahuan" }),
  ).toContainText(/contoh/);
  await page.getByRole("tab", { name: "Ringkasan", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Rincian tampilan komponen" }),
  ).toHaveAttribute("aria-selected", "true");
  const accordion = page.getByRole("button", {
    name: "Apakah contoh ini membuat transaksi?",
  });
  await accordion.focus();
  await page.keyboard.press("Enter");
  await expect(accordion).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Space");
  await expect(accordion).toHaveAttribute("aria-expanded", "false");
});

test("axe checks the lab, errors, overlays and navigation states", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto(lab);
  const check = async () =>
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  await check();
  await page.getByRole("button", { name: "Periksa contoh" }).click();
  await check();
  for (const trigger of [
    "Buka dialog",
    "Buka drawer",
    "Buka bottom sheet",
    "Buka popover",
  ]) {
    await page.getByRole("button", { name: trigger, exact: true }).click();
    await check();
    await page.keyboard.press("Escape");
  }
  await page.getByRole("button", { name: "Tindakan", exact: true }).click();
  await check();
});

test("200% text and reduced motion preserve lab controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(lab);
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
  await page.getByRole("button", { name: "Selesaikan status demo" }).click();
  await expect(page.getByTestId("motion-status")).toHaveCSS(
    "transform",
    "none",
  );
  await expect(page.locator(".ui-spinner")).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "Buka drawer", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCSS("transform", "none");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBe(0);
  await page.keyboard.press("Escape");
  const smallTargets = await page
    .locator(
      "button:not(:disabled), .lab-navigation a, .ui-choice, .commerce-denomination, .commerce-payment",
    )
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            (rect.width < 44 || rect.height < 44)
          );
        })
        .map((element) => element.textContent),
    );
  expect(smallTargets).toEqual([]);
  await page.screenshot({
    path: "artifacts/phase-2/lab-zoom.png",
    fullPage: true,
  });
});
