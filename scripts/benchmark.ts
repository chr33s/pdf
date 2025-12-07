import { readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { URL, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { gzipSync } from "node:zlib";

// npm install --no-save pdf-lib @pdf-lib/fontkit && sudo purge && node --expose-gc ./scripts/benchmark.ts

type FileEntry = {
  path: string;
  size: number;
};

type ResolvedTarget = {
  packageName: string;
  distPath: string;
  packageFile?: string;
  packageFileMin?: string;
};

type SizeResult = {
  label: string;
  distPath: string;
  fileCount: number;
  totalBytes: number;
  minifiedPath?: string;
  minifiedBytes?: number;
  minifiedGzipBytes?: number;
};

type ScenarioResult = {
  label: string;
  runs: number;
  cold: SampleStats;
  warm: SampleStats;
  rssCold: SampleStats;
  rssWarm: SampleStats;
  warmThroughput: number;
  peakRss: number;
  peakHeap: number;
};

type BenchmarkTables = {
  sizeDepsSection: string;
  perfSection: string;
};

type BenchmarkArtifact = {
  generatedAt: string;
  sizeResults: SizeResult[];
  perfResults: ScenarioResult[];
};

export type DirectoryStats = {
  path: string;
  fileCount: number;
  totalBytes: number;
  files: FileEntry[];
};

export type DirectoryStatsOptions = {
  include?: RegExp[];
  exclude?: RegExp[];
};

export type SampleStats = {
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
};

const require = createRequire(import.meta.url);
const repoRoot = resolve(import.meta.dirname, "..");
const defaultFontPath = resolve(repoRoot, "packages/fontkit/test/data/amiri/amiri-regular.ttf");
const benchmarkJsonPath = resolve(repoRoot, "scripts", "benchmark.json");

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "n/a";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

export function formatSignedPercentDelta(current?: number, baseline?: number): string {
  if (current === undefined || baseline === undefined) return "n/a";
  if (baseline === 0) return current === 0 ? "0.0%" : "n/a";
  const delta = ((current - baseline) / baseline) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

export function formatSignedBytesDelta(current?: number, baseline?: number): string {
  if (current === undefined || baseline === undefined) return "n/a";
  const diff = current - baseline;
  const percent = formatSignedPercentDelta(current, baseline);
  const sign = diff >= 0 ? "+" : "";
  const formatted = formatBytes(Math.abs(diff));
  return percent === "n/a" ? `${sign}${formatted}` : `${sign}${formatted} (${percent})`;
}

export function formatSignedNumberDelta(current?: number, baseline?: number): string {
  if (current === undefined || baseline === undefined) return "n/a";
  const diff = current - baseline;
  const percent = formatSignedPercentDelta(current, baseline);
  const sign = diff >= 0 ? "+" : "";
  return percent === "n/a" ? `${sign}${diff}` : `${sign}${diff} (${percent})`;
}

export function summarizeSamples(samples: number[]): SampleStats {
  if (!samples.length) {
    return { max: 0, mean: 0, median: 0, min: 0, p95: 0 };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));

  return {
    max: sorted[sorted.length - 1],
    mean: sum / sorted.length,
    median,
    min: sorted[0],
    p95: sorted[p95Index],
  };
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

export async function collectTargetFiles(target: ResolvedTarget): Promise<FileEntry[]> {
  const names = [target.packageFile, target.packageFileMin].filter(Boolean) as string[];
  const seen = new Set<string>();
  const files: FileEntry[] = [];

  for (const name of names) {
    const filePath = resolve(target.distPath, name);
    if (seen.has(filePath)) continue;
    seen.add(filePath);

    if (!(await pathExists(filePath))) {
      console.warn(
        `Skipping missing file for ${target.packageName}: ${relative(repoRoot, filePath)}`,
      );
      continue;
    }

    const { size } = await stat(filePath);
    files.push({ path: filePath, size });
  }

  return files;
}

export function pickMinified(files: FileEntry[], target: ResolvedTarget): FileEntry | undefined {
  if (target.packageFileMin) {
    const expected = resolve(target.distPath, target.packageFileMin);
    const match = files.find((file) => file.path === expected);
    if (match) return match;
  }

  return files.find((file) => /\.min\.[cm]?js$/.test(file.path));
}

function resolvePackageRoot(packageName: string): string | null {
  try {
    const pkgPath = require.resolve(`${packageName}/package.json`, { paths: [repoRoot] });
    return dirname(pkgPath);
  } catch {
    return null;
  }
}

export async function resolveEntryFile(target: ResolvedTarget): Promise<string | null> {
  const candidates = [
    ...(target.packageFile ? [target.packageFile] : []),
    ...(target.packageFileMin ? [target.packageFileMin] : []),
  ];

  for (const candidate of candidates) {
    const candidatePath = resolve(target.distPath, candidate);
    if (await pathExists(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

async function collectSizeResults(targets: ResolvedTarget[]): Promise<SizeResult[]> {
  const results: SizeResult[] = [];
  for (const target of targets) {
    const distFiles = await collectTargetFiles(target);
    const distBytes = distFiles.reduce((total, file) => total + file.size, 0);
    const minified = pickMinified(distFiles, target);
    const minifiedGzipBytes = minified ? gzipSync(await readFile(minified.path)).length : undefined;
    results.push({
      distPath: target.distPath,
      fileCount: distFiles.length,
      label: target.packageName,
      minifiedGzipBytes,
      minifiedBytes: minified?.size,
      minifiedPath: minified?.path,
      totalBytes: distBytes,
    });
  }
  return results;
}

async function loadPdfModule(
  entry: string,
): Promise<{ PDFDocument?: any; StandardFonts?: any } | null> {
  try {
    return await import(pathToFileURL(entry).href);
  } catch {
    return null;
  }
}

async function runPdfScenario(entry: string): Promise<number> {
  const mod = await loadPdfModule(entry);
  if (!mod?.PDFDocument || !mod?.StandardFonts) {
    throw new Error("PDF module missing PDFDocument or StandardFonts exports");
  }

  const { PDFDocument, StandardFonts } = mod;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 750]);
  const font = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
  const text = "Benchmarks should be repeatable and comparable.";
  for (let i = 0; i < 10; i++) {
    page.drawText(text, { x: 50, y: 700 - i * 24, size: 16, font });
  }
  const bytes = await pdfDoc.save();
  return bytes.length;
}

async function loadFontkit(entry: string) {
  const mod = await import(pathToFileURL(entry).href);
  return (mod as any).default ?? mod;
}

async function runFontkitScenario(entry: string, fontData: Uint8Array): Promise<number> {
  const fontkit = await loadFontkit(entry);
  if (!fontkit || typeof fontkit.create !== "function") {
    throw new Error("Fontkit module missing create export");
  }

  const font = await fontkit.create(fontData);
  const run = await font.layout("Sphinx of black quartz, judge my vow.");
  return run.glyphs.length;
}

async function runScenarioForTarget(
  target: ResolvedTarget,
  runs: number,
  fontData: Uint8Array,
): Promise<ScenarioResult> {
  const entry = await resolveEntryFile(target);
  if (!entry) {
    throw new Error(`No entry file found for ${target.packageName}`);
  }

  if (/fontkit/i.test(target.packageName)) {
    return measureScenario(target.packageName, runs, () => runFontkitScenario(entry, fontData));
  }
  return measureScenario(target.packageName, runs, () => runPdfScenario(entry));
}

async function runScenarioIsolated(
  target: ResolvedTarget,
  runs: number,
  fontData: Uint8Array,
): Promise<ScenarioResult> {
  return new Promise((resolve, reject) => {
    const workerScript = new URL("./benchmark.ts", import.meta.url);
    const worker = new Worker(workerScript, {
      // @ts-expect-error Node supports ESM workers; type may not be in bundled types
      type: "module",
      workerData: {
        fontData,
        kind: "perf",
        runs,
        target,
      },
    });

    worker.once("message", (message) => {
      if (message?.error) {
        reject(new Error(message.error));
        return;
      }
      resolve(message.result as ScenarioResult);
    });
    worker.once("error", reject);
  });
}

async function measureScenario(
  label: string,
  runs: number,
  scenario: () => Promise<unknown>,
): Promise<ScenarioResult> {
  const coldDurations: number[] = [];
  const warmDurations: number[] = [];
  const coldRss: number[] = [];
  const warmRss: number[] = [];
  let peakRss = 0;
  let peakHeap = 0;
  let warmTotalMs = 0;

  for (let i = 0; i < runs; i++) {
    if (typeof global.gc === "function") {
      global.gc();
    }

    const memBefore = process.memoryUsage();
    const start = performance.now();
    await scenario();
    const end = performance.now();
    const memAfter = process.memoryUsage();

    peakRss = Math.max(peakRss, memBefore.rss, memAfter.rss);
    peakHeap = Math.max(peakHeap, memBefore.heapUsed, memAfter.heapUsed);

    const delta = memAfter.rss - memBefore.rss;
    const duration = end - start;
    if (i === 0) {
      coldDurations.push(duration);
      coldRss.push(delta);
    } else {
      warmDurations.push(duration);
      warmRss.push(delta);
      warmTotalMs += duration;
    }
  }

  const warmThroughput = warmTotalMs > 0 ? warmDurations.length / (warmTotalMs / 1000) : 0;

  return {
    cold: summarizeSamples(coldDurations),
    label,
    peakHeap,
    peakRss,
    rssCold: summarizeSamples(coldRss),
    rssWarm: summarizeSamples(warmRss),
    runs,
    warmThroughput,
    warm: summarizeSamples(warmDurations),
  };
}

async function runPerformanceBenchmarks(
  targets: ResolvedTarget[],
  runs: number,
  isolate: boolean,
): Promise<ScenarioResult[]> {
  const scenarios: ScenarioResult[] = [];
  const fontData = await readFile(defaultFontPath);

  for (const target of targets) {
    try {
      const result = isolate
        ? await runScenarioIsolated(target, runs, fontData)
        : await runScenarioForTarget(target, runs, fontData);
      scenarios.push(result);
    } catch (error) {
      console.error(`Skipping scenario for ${target.packageName}:`, (error as Error).message);
    }
  }

  return scenarios;
}

function renderSizeDepsRow(label: string, size?: SizeResult): string {
  const distTotal = size ? formatBytes(size.totalBytes) : "n/a";
  const minified = size?.minifiedBytes ? `${formatBytes(size.minifiedBytes)}` : "n/a";
  const minifiedGzip = size?.minifiedGzipBytes ? `${formatBytes(size.minifiedGzipBytes)}` : "n/a";

  return `| ${label} | ${distTotal} | ${minified} | ${minifiedGzip} |`;
}

function renderSizeDepsCombined(
  pairs: Array<{ primary: string; compare: string }>,
  sizeResults: SizeResult[],
): string | null {
  const rows: string[] = ["| Name | Size | min | min.gz |", "|------|------|-----|--------|"];
  let hasData = false;

  for (const pair of pairs) {
    const primarySize = sizeResults.find((entry) => entry.label === pair.primary);
    const compareSize = sizeResults.find((entry) => entry.label === pair.compare);

    if (!primarySize && !compareSize) continue;
    hasData = true;

    rows.push(renderSizeDepsRow(pair.primary, primarySize));
    rows.push(renderSizeDepsRow(pair.compare, compareSize));

    if (primarySize && compareSize) {
      rows.push(
        `| Δ | ${formatSignedBytesDelta(primarySize.totalBytes, compareSize.totalBytes)} | ${formatSignedBytesDelta(primarySize.minifiedBytes, compareSize.minifiedBytes)} | ${formatSignedBytesDelta(primarySize.minifiedGzipBytes, compareSize.minifiedGzipBytes)} | ${formatSignedNumberDelta(primarySize.fileCount, compareSize.fileCount)} |`,
      );
    }
  }

  return hasData ? rows.join("\n") : null;
}

function renderPerfRow(label: string, result?: ScenarioResult): string {
  const cold = result ? result.cold.mean.toFixed(2) : "n/a";
  const warm = result ? result.warm.mean.toFixed(2) : "n/a";
  const warmMedian = result ? result.warm.median.toFixed(2) : "n/a";
  const warmP95 = result ? result.warm.p95.toFixed(2) : "n/a";
  const warmRss = result ? formatBytes(result.rssWarm.mean) : "n/a";
  const throughput = result ? result.warmThroughput.toFixed(2) : "n/a";
  const peakRss = result ? formatBytes(result.peakRss) : "n/a";
  const peakHeap = result ? formatBytes(result.peakHeap) : "n/a";

  return `| ${label} | ${cold} | ${warm} | ${warmMedian} | ${warmP95} | ${warmRss} | ${throughput} | ${peakRss} | ${peakHeap} |`;
}

function renderPerfCombined(
  pairs: Array<{ primary: string; compare: string }>,
  perfResults: ScenarioResult[],
): string | null {
  const rows: string[] = [
    "| Name | cold avg (ms) | warm avg (ms) | warm median (ms) | warm p95 (ms) | warm rss Δ avg | warm throughput (ops/s) | peak RSS | peak heap |",
    "|------|---------------|---------------|------------------|---------------|----------------|-------------------------|----------|-----------|",
  ];
  let hasData = false;

  for (const pair of pairs) {
    const primary = perfResults.find((entry) => entry.label === pair.primary);
    const compare = perfResults.find((entry) => entry.label === pair.compare);

    if (!primary && !compare) continue;
    hasData = true;

    rows.push(renderPerfRow(pair.primary, primary));
    rows.push(renderPerfRow(pair.compare, compare));

    if (primary && compare) {
      rows.push(
        `| Δ | ${formatSignedPercentDelta(primary.cold.mean, compare.cold.mean)} | ${formatSignedPercentDelta(primary.warm.mean, compare.warm.mean)} | ${formatSignedPercentDelta(primary.warm.median, compare.warm.median)} | ${formatSignedPercentDelta(primary.warm.p95, compare.warm.p95)} | ${formatSignedBytesDelta(primary.rssWarm.mean, compare.rssWarm.mean)} | ${formatSignedPercentDelta(primary.warmThroughput, compare.warmThroughput)} | ${formatSignedBytesDelta(primary.peakRss, compare.peakRss)} | ${formatSignedBytesDelta(primary.peakHeap, compare.peakHeap)} |`,
      );
    }
  }

  return hasData ? rows.join("\n") : null;
}

function renderSection(title: string, table: string | null): string {
  return [`### ${title}`, "", table ?? "n/a", ""].join("\n");
}

export function buildBenchmarkSections(
  sizeResults: SizeResult[],
  perfResults: ScenarioResult[],
): BenchmarkTables {
  const comparisons = [
    { compare: "pdf-lib", primary: "@chr33s/pdf" },
    { compare: "@pdf-lib/fontkit", primary: "@chr33s/pdf-fontkit" },
  ];

  const sizeTable = renderSizeDepsCombined(comparisons, sizeResults);
  const perfTable = renderPerfCombined(comparisons, perfResults);

  return {
    perfSection: renderSection("Performance", perfTable),
    sizeDepsSection: renderSection("Size", sizeTable),
  };
}

function buildBenchmarkArtifact(
  sizeResults: SizeResult[],
  perfResults: ScenarioResult[],
): BenchmarkArtifact {
  return {
    generatedAt: new Date().toISOString(),
    perfResults,
    sizeResults,
  };
}

async function writeBenchmarkJson(artifact: BenchmarkArtifact): Promise<void> {
  const payload = JSON.stringify(artifact, null, 2);
  await writeFile(benchmarkJsonPath, `${payload}\n`, "utf-8");
}

async function updateReadme(tables: BenchmarkTables): Promise<void> {
  const readmePath = resolve(repoRoot, "README.md");
  const content = await readFile(readmePath, "utf-8");
  const lines = content.split(/\r?\n/);

  const headerIndex = lines.findIndex((line) => line.trim() === "## Benchmark");
  if (headerIndex === -1) {
    console.warn("README.md missing ## Benchmark section; skipping table update.");
    return;
  }

  let endIndex = lines.length;
  for (let i = headerIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ") && lines[i].trim() !== "## Benchmark") {
      endIndex = i;
      break;
    }
  }

  const before = lines.slice(0, headerIndex + 1);
  const after = lines.slice(endIndex);

  const replacement = ["", tables.sizeDepsSection, tables.perfSection].join("\n");
  const nextContent = [...before, replacement, ...after].join("\n");

  await writeFile(readmePath, nextContent.trimEnd() + "\n", "utf-8");
}

async function resolveTargets(): Promise<ResolvedTarget[]> {
  const candidates: Array<Omit<ResolvedTarget, "distPath"> & { root?: string | null }> = [
    {
      packageFile: "index.bundle.js",
      packageFileMin: "index.min.js",
      packageName: "@chr33s/pdf",
      root: resolve(repoRoot, "packages/pdf"),
    },
    {
      packageFile: "index.bundle.js",
      packageFileMin: "index.min.js",
      packageName: "@chr33s/pdf-fontkit",
      root: resolve(repoRoot, "packages/fontkit"),
    },
    {
      packageFile: "pdf-lib.esm.js",
      packageFileMin: "pdf-lib.esm.min.js",
      packageName: "pdf-lib",
      root: resolvePackageRoot("pdf-lib"),
    },
    {
      packageFile: "fontkit.es.js",
      packageFileMin: "fontkit.es.min.js",
      packageName: "@pdf-lib/fontkit",
      root: resolvePackageRoot("@pdf-lib/fontkit"),
    },
  ];

  const resolved: ResolvedTarget[] = [];
  for (const candidate of candidates) {
    if (!candidate.root || !(await pathExists(candidate.root))) {
      console.warn(`Skipping ${candidate.packageName}: package not found locally`);
      continue;
    }

    const distPath = resolve(candidate.root, "dist");
    if (!(await pathExists(distPath))) {
      console.warn(
        `Skipping ${candidate.packageName}: dist folder missing at ${relative(repoRoot, distPath)}`,
      );
      continue;
    }

    resolved.push({
      distPath,
      packageFile: candidate.packageFile,
      packageFileMin: candidate.packageFileMin,
      packageName: candidate.packageName,
    });
  }

  return resolved;
}

// Worker entry point for isolated perf runs
if (!isMainThread && parentPort && workerData?.kind === "perf") {
  const data = workerData as {
    kind: string;
    runs: number;
    target: ResolvedTarget;
    fontData?: Uint8Array;
  };

  const fontData = data.fontData ? new Uint8Array(data.fontData) : new Uint8Array();

  runScenarioForTarget(data.target, data.runs, fontData)
    .then((result) => parentPort?.postMessage({ result }))
    .catch((error: Error) => parentPort?.postMessage({ error: error.message }));
}

async function main(): Promise<void> {
  const args = parseArgs({
    options: {
      runs: {
        default: "500",
        short: "r",
        type: "string",
      },
    },
  });
  const runs = parseInt(String(args.values.runs), 10);
  if (!Number.isFinite(runs) || runs < 1) {
    throw new Error(`Invalid runs value: ${String(args.values.runs)}`);
  }

  console.log(
    "Note: For steadier results, set the machine to a fixed performance/power mode (e.g., macOS: Battery > Low Power Mode off; disable Automatic graphics switching).",
  );

  const targets = await resolveTargets();
  if (!targets.length) {
    console.error("No benchmark targets found. Build packages and install competitors first.");
    return;
  }

  const sizeResults = await collectSizeResults(targets);

  const perfResults = await runPerformanceBenchmarks(targets, runs, true);
  if (!perfResults.length) {
    console.warn("Perf isolation produced no results; retrying without isolation.");
    const retry = await runPerformanceBenchmarks(targets, runs, false);
    perfResults.push(...retry);
  }

  const tables = buildBenchmarkSections(sizeResults, perfResults);
  await updateReadme(tables);

  const artifact = buildBenchmarkArtifact(sizeResults, perfResults);
  await writeBenchmarkJson(artifact);
}

if (isMainThread && import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main();
}
