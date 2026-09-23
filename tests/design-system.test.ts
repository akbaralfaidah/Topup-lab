import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isDesignLabAllowed } from "../src/lib/design-lab";

test("Design Lab requires demo mode and defaults closed in production", () => {
  for (const mode of ["demo", "live"]) {
    for (const nodeEnv of ["development", "test", "production"]) {
      for (const enabled of [undefined, "false", "true", "1"]) {
        assert.equal(
          isDesignLabAllowed({
            NODE_ENV: nodeEnv,
            APP_MODE: mode,
            DESIGN_LAB_ENABLED: enabled,
          }),
          mode === "demo" && (nodeEnv === "development" || enabled === "true"),
        );
      }
    }
  }
});

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((value) => parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
test("semantic text and control borders meet contrast floors", () => {
  const css = readFileSync("src/styles/tokens.css", "utf8");
  const colors = Object.fromEntries(
    [...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
  const pairs: [string, string, number][] = [];
  for (const surface of [
    "surface-page",
    "surface-default",
    "surface-subdued",
  ]) {
    for (const text of [
      "text-primary",
      "text-secondary",
      "text-muted",
      "text-disabled",
    ])
      pairs.push([text, surface, 4.5]);
    pairs.push(["border-default", surface, 3]);
  }
  for (const state of ["subtle", "soft", "default", "hover", "active"])
    pairs.push(["brand-foreground", `brand-${state}`, 4.5]);
  for (const tone of ["success", "warning", "danger", "info"]) {
    pairs.push([`${tone}-foreground`, `${tone}-subtle`, 4.5]);
    pairs.push([`${tone}-border`, `${tone}-subtle`, 3]);
  }
  pairs.push(
    ["text-inverse", "surface-inverse", 4.5],
    ["text-inverse", "danger-foreground", 4.5],
  );
  for (const [foreground, background, threshold] of pairs) {
    const a = luminance(colors[foreground]!);
    const b = luminance(colors[background]!);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert.ok(
      ratio >= threshold,
      `${foreground} on ${background}: ${ratio.toFixed(2)} < ${threshold}`,
    );
  }
});
