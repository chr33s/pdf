import { playwright } from "@vitest/browser-playwright";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { defineConfig, Plugin } from "vitest/config";

const repoRoot = resolve(__dirname, "../..");

// Custom plugin to serve files from repo root
function serveRepoRoot(): Plugin {
  return {
    name: "serve-repo-root",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/packages/")) {
          const filePath = resolve(repoRoot, req.url.slice(1));
          if (existsSync(filePath)) {
            const content = readFileSync(filePath);
            res.end(content);
            return;
          }
        }
        next();
      });
    },
  };
}

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
    serveRepoRoot(),
  ],
  server: {
    fs: {
      allow: [repoRoot],
      strict: false,
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    include: ["tests/**/*.test.ts"],
    testTimeout: 60000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@chr33s/pdf": resolve(__dirname, "../../packages/pdf/dist/index.js"),
      "@chr33s/fontkit": resolve(__dirname, "../../packages/fontkit/dist/index.js"),
    },
  },
  optimizeDeps: {
    include: [
      "buffer",
      "iconv-lite",
      "safer-buffer",
      "color",
      "node-html-better-parser",
      "pako",
      "crypto-js",
      "clone",
      "base64-arraybuffer",
      "deep-equal",
      "vite-plugin-node-polyfills/shims/buffer",
      "vite-plugin-node-polyfills/shims/global",
      "vite-plugin-node-polyfills/shims/process",
      "node:stream",
      "node:util",
      "module",
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
