import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { "index.min": "src/index.ts" },
  format: "esm",
  minify: true,
  outDir: "dist",
  dts: false,
  clean: false,
  noExternal: [/.*/],
  platform: "browser",
});
