import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import path from "node:path";

const assetsPath = path.resolve(__dirname, "../../packages/pdf/assets");

export default defineWorkersConfig({
  resolve: {
    alias: {
      "@chr33s/pdf-fontkit": path.resolve(__dirname, "../../packages/fontkit/dist/index.js"),
      "@chr33s/pdf": path.resolve(__dirname, "../../packages/pdf/dist/index.js"),
    },
  },
  test: {
    poolOptions: {
      workers: {
        singleWorker: true,
        wrangler: { configPath: "./wrangler.json" },
        miniflare: {
          assets: {
            directory: assetsPath,
            binding: "ASSETS",
          },
        },
      },
    },
    include: ["test/**/*.test.ts"],
    testTimeout: 30000,
  },
});
