import { defineConfig, devices } from "@playwright/test";

// Spec §9.4, plan Q22. In CI the phone and tablet projects run real WebKit. Locally and in
// cloud sessions they run Chromium with the device's viewport, touch and user agent.
// PW_CHANNEL picks an installed browser (this machine: msedge) instead of downloading one.
const ci = !!process.env.CI;
const channel = process.env.PW_CHANNEL;
const phoneBrowser = ci ? "webkit" : "chromium";
const local = channel ? { channel } : {};
const port = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: "tests",
  testMatch: ["e2e/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "iphone-15",
      use: { ...devices["iPhone 15"], browserName: phoneBrowser, ...(ci ? {} : local) },
    },
    {
      name: "iphone-se",
      use: { ...devices["iPhone SE (3rd gen)"], browserName: phoneBrowser, ...(ci ? {} : local) },
    },
    {
      name: "ipad",
      use: { ...devices["iPad (gen 7)"], browserName: phoneBrowser, ...(ci ? {} : local) },
    },
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 }, ...local },
    },
    {
      name: "desktop-webkit",
      use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !ci,
    timeout: 120_000,
    env: { SV_E2E: "1", OPS_EVENTS_URL: "" },
  },
});
