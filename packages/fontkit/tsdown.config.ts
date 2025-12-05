import { defineConfig } from "tsdown";
import { defineEnv } from "unenv";

const { env } = defineEnv({ nodeCompat: true });

export default defineConfig({
  entry: { "index.min": "src/index.ts" },
  format: "esm",
  minify: true,
  outDir: "dist",
  dts: false,
  clean: false,
  noExternal: [/.*/],
  platform: "browser",
  alias: env.alias,
});
