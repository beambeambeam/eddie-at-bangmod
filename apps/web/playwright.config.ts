import { defineConfig } from "@playwright/test";

const launchArgs = ["--enable-unsafe-swiftshader"];

if (process.platform === "darwin") {
  launchArgs.push("--enable-gpu", "--use-angle=metal");
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  outputDir: "../../node_modules/.cache/eddie-playwright",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3001",
    launchOptions: { args: launchArgs },
  },
});
