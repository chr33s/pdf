import { access, copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, "..");
const srcDir = join(packageRoot, "src/opentype/shapers");
const destDir = join(packageRoot, "dist/opentype/shapers");

if (
  !access(srcDir)
    .then(() => true)
    .catch(() => false)
) {
  process.exit(0);
}

const dataFiles = (await readdir(srcDir)).filter(
  (file) => file.endsWith(".json") || file.endsWith("-data.js"),
);

if (dataFiles.length === 0) {
  process.exit(0);
}

await mkdir(destDir, { recursive: true });

for (const file of dataFiles) {
  await copyFile(join(srcDir, file), join(destDir, file));
}

console.log(`Copied ${dataFiles.length} shaper data file(s) to dist.`);
