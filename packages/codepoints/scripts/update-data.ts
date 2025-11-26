import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const unicodeVersion = process.env.UNICODE_VERSION ?? "12.0.0";
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(packageRoot, "data");

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      for await (const child of walk(entryPath)) {
        yield child;
      }
    } else {
      yield entryPath;
    }
  }
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function downloadFile(source: string, destination: string): Promise<void> {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to download ${source}: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await ensureDir(dirname(destination));
  await writeFile(destination, Buffer.from(arrayBuffer));
}

async function main(): Promise<void> {
  console.log(`Fetching Unicode data files (version ${unicodeVersion})...`);

  for await (const absolutePath of walk(dataDir)) {
    if (!absolutePath.endsWith(".txt")) continue;

    const relativePath = relative(dataDir, absolutePath).split("\\").join("/");
    const url = `https://www.unicode.org/Public/${unicodeVersion}/ucd/${relativePath}`;

    const stats = await stat(absolutePath).catch(() => null);
    const previousSize = stats?.size ?? 0;

    await downloadFile(url, absolutePath);

    const newStats = await stat(absolutePath);
    const sizeChange = newStats.size - previousSize;
    const changeLabel =
      sizeChange === 0 ? "unchanged" : sizeChange > 0 ? `+${sizeChange}` : `${sizeChange}`;
    console.log(`Downloaded ${relativePath} (${newStats.size} bytes, ${changeLabel})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
