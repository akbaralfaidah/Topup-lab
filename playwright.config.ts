import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";

const password = randomBytes(24).toString("hex");
const testServers = [
  { port: 3000, mode: "demo", lab: "false" },
  { port: 3100, mode: "demo", lab: "true" },
  { port: 3102, mode: "live", lab: "true" },
];

export default defineConfig({
  testDir: "./tests/browser",
  testIgnore: ["home-demo.spec.ts", "catalog-demo.spec.ts"],
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:3000",
    channel: "msedge",
    screenshot: "only-on-failure",
  },
  reporter: "list",
  webServer: testServers.map(({ port, mode, lab }) => ({
    command: "npm start",
    url: `http://127.0.0.1:${port}/api/health`,
    timeout: 120000,
    reuseExistingServer: false,
    env: {
      NODE_ENV: "production",
      APP_MODE: mode,
      DESIGN_LAB_ENABLED: lab,
      APP_URL: "https://localhost",
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
      DATABASE_URL: `postgresql://topuplab:${password}@127.0.0.1:5432/topuplab`,
      REDIS_URL: `redis://:${password}@127.0.0.1:6379`,
    },
  })),
});
