import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { "index.min": "src/index.ts" },
  format: "esm",
  minify: true,
  outDir: "dist",
  dts: false,
  clean: false,
  noExternal: [/.*/],
  // Target browser: eliminate Node.js-specific code paths
  platform: "browser",
});
