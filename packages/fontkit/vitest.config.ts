import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.ts"],
    exclude: ["test/utils/**", "test/add-test-helpers-to-fontkit.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
