import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      // Make sure tests import from src TypeScript files
      "../src/index.js": resolve(__dirname, "src/index.ts"),
    },
  },
});
