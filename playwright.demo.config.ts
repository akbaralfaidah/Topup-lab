import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: [
    "home-demo.spec.ts",
    "catalog-demo.spec.ts",
    "preparation-demo.spec.ts",
  ],
  workers: 1,
  use: { baseURL: "http://localhost:3200", channel: "msedge" },
  reporter: "list",
});
