import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

// Review screenshots only: one Chromium project, sizes set per test. Needs a build made
// with NEXT_PUBLIC_DEV_KIT=1 so /dev/kit exists.
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  ...base,
  testMatch: ["visual/**/*.spec.ts"],
  fullyParallel: false,
  workers: 1,
  projects: [{ name: "review", use: { ...devices["Desktop Chrome"], ...(channel ? { channel } : {}) } }],
});
