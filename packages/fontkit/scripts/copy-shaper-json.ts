import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, "..");
const srcDir = join(packageRoot, "src/opentype/shapers");
const destDir = join(packageRoot, "dist/opentype/shapers");

if (!existsSync(srcDir)) {
  process.exit(0);
}

const dataFiles = readdirSync(srcDir).filter(
  (file) => file.endsWith(".json") || file.endsWith("Data.js"),
);

if (dataFiles.length === 0) {
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });

for (const file of dataFiles) {
  copyFileSync(join(srcDir, file), join(destDir, file));
}

console.log(`Copied ${dataFiles.length} shaper data file(s) to dist.`);
