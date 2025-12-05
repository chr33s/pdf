import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { sharedPlugins, sharedResolve, sharedServer } from "./vite.shared-config.js";

export default defineConfig({
  plugins: sharedPlugins,
  server: sharedServer,
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    include: ["test/**/*.test.ts"],
    testTimeout: 60000,
    hookTimeout: 30000,
  },
  resolve: sharedResolve,
});
