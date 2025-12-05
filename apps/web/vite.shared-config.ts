import { readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { PluginOption, ResolveOptions, ServerOptions } from "vite";

const currentDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(currentDir, "../..");

type StaticDirectoryMount = {
  prefix: string;
  basePath: string;
};

const staticDirectoryMounts: StaticDirectoryMount[] = [
  { prefix: "/packages/pdf/assets/", basePath: resolve(repoRoot, "packages/pdf/assets") },
  { prefix: "/packages/pdf/dist/", basePath: resolve(repoRoot, "packages/pdf/dist") },
  { prefix: "/packages/fontkit/dist/", basePath: resolve(repoRoot, "packages/fontkit/dist") },
  { prefix: "/assets/", basePath: resolve(repoRoot, "packages/pdf/assets") },
];

const mimeTypes: Record<string, string> = {
  ".css": "text/css",
  ".gif": "image/gif",
  ".html": "text/html",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript",
  ".json": "application/json",
  ".map": "application/json",
  ".mjs": "application/javascript",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const getMimeType = (filePath: string): string =>
  mimeTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream";

const servePackageFiles = (): PluginOption => ({
  name: "serve-package-files",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url?.split("?")[0];
      if (!url) {
        next();
        return;
      }

      const directoryMount = staticDirectoryMounts.find((entry) => url.startsWith(entry.prefix));
      if (directoryMount) {
        const relativePath = url.slice(directoryMount.prefix.length);
        if (!relativePath) {
          next();
          return;
        }

        const assetPath = resolve(directoryMount.basePath, relativePath);
        if (!assetPath.startsWith(directoryMount.basePath)) {
          next();
          return;
        }

        try {
          const content = readFileSync(assetPath);
          res.setHeader("Content-Type", getMimeType(assetPath));
          res.end(content);
          return;
        } catch {
          next();
          return;
        }
      }

      next();
    });
  },
});

export const sharedPlugins: PluginOption[] = [servePackageFiles()];

export const sharedServer: ServerOptions = {
  fs: {
    allow: [repoRoot],
    strict: false,
  },
  port: 8080,
};

export const sharedResolve: ResolveOptions = {
  alias: {
    "/packages/pdf/assets": resolve(repoRoot, "packages/pdf/assets"),
  },
};
