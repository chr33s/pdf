import { playwright } from "@vitest/browser-playwright";
import { readFileSync } from "fs";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { defineConfig } from "vitest/config";

const repoRoot = resolve(__dirname, "../..");

export default defineConfig({
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    {
      name: "serve-pdf-assets",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/packages/pdf/assets/")) {
            const assetPath = resolve(repoRoot, req.url.slice(1));
            try {
              const content = readFileSync(assetPath);
              res.setHeader("Content-Type", "application/octet-stream");
              res.end(content);
            } catch {
              next();
            }
          } else {
            next();
          }
        });
      },
    },
  ],
  server: {
    fs: {
      allow: [repoRoot],
      strict: false,
    },
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    include: ["test/**/*.test.ts"],
    testTimeout: 60000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@chr33s/pdf": resolve(__dirname, "../../packages/pdf/dist/index.min.js"),
      "@chr33s/pdf-fontkit": resolve(__dirname, "../../packages/fontkit/dist/index.min.js"),
      "/packages/pdf/assets": resolve(__dirname, "../../packages/pdf/assets"),
    },
  },
});
