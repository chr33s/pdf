import { defineConfig } from "tsdown";
import { defineEnv } from "unenv";

const { env } = defineEnv({ nodeCompat: true });

export default defineConfig([
  {
    alias: env.alias,
    clean: false,
    dts: false,
    entry: { "index.min": "src/index.ts" },
    format: "esm",
    minify: true,
    noExternal: [/.*/],
    outDir: "dist",
    platform: "browser",
  },
  {
    clean: false,
    entry: { "index.bundle": "./src/index.ts" },
    fixedExtension: false,
    format: "esm",
    platform: "node",
  },
]);
