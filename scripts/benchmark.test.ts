import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import {
  buildBenchmarkSections,
  collectTargetFiles,
  formatBytes,
  formatSignedBytesDelta,
  formatSignedNumberDelta,
  formatSignedPercentDelta,
  pickMinified,
  resolveEntryFile,
  summarizeSamples,
} from "./benchmark.js";

describe("benchmark helpers", () => {
  test("summarizeSamples handles aggregates", () => {
    const stats = summarizeSamples([10, 20, 30, 40, 50]);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
    expect(stats.median).toBe(30);
    expect(stats.mean).toBeCloseTo(30);
    expect(stats.p95).toBe(50);
  });

  test("formatBytes renders readable units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.00 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });

  test("formatSignedPercentDelta renders signed percentages", () => {
    expect(formatSignedPercentDelta(110, 100)).toBe("+10.0%");
    expect(formatSignedPercentDelta(90, 100)).toBe("-10.0%");
    expect(formatSignedPercentDelta(0, 0)).toBe("0.0%");
    expect(formatSignedPercentDelta(10, 0)).toBe("n/a");
    expect(formatSignedPercentDelta(undefined, 100)).toBe("n/a");
  });

  test("formatSignedBytesDelta renders byte deltas with percent when available", () => {
    expect(formatSignedBytesDelta(2048, 1024)).toBe("+1.00 KB (+100.0%)");
    expect(formatSignedBytesDelta(512, 1024)).toBe("512 B (-50.0%)");
    expect(formatSignedBytesDelta(1024, 0)).toBe("+1.00 KB");
    expect(formatSignedBytesDelta(undefined, 1024)).toBe("n/a");
  });

  test("formatSignedNumberDelta renders numeric deltas with percent when available", () => {
    expect(formatSignedNumberDelta(6, 3)).toBe("+3 (+100.0%)");
    expect(formatSignedNumberDelta(3, 6)).toBe("-3 (-50.0%)");
    expect(formatSignedNumberDelta(2, 0)).toBe("+2");
    expect(formatSignedNumberDelta(undefined, 1)).toBe("n/a");
  });

  test("collectTargetFiles only reads declared artifacts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "benchmark-targets-"));
    await writeFile(join(dir, "bundle.js"), "abcd");
    await writeFile(join(dir, "bundle.min.js"), "abcdef");
    await writeFile(join(dir, "extra.js"), "should not be read");

    const files = await collectTargetFiles({
      distPath: dir,
      label: "demo",
      packageFile: "bundle.js",
      packageFileMin: "bundle.min.js",
      packageName: "demo",
    } as any);

    const names = files.map((file) => file.path.slice(dir.length + 1));
    expect(names).toStrictEqual(["bundle.js", "bundle.min.js"]);
    expect(files.map((file) => file.size)).toStrictEqual([4, 6]);
  });

  test("resolveEntryFile prefers packageFile when present", async () => {
    const dir = await mkdtemp(join(tmpdir(), "benchmark-entry-prefer-"));
    await writeFile(join(dir, "index.bundle.js"), "main");
    await writeFile(join(dir, "index.min.js"), "min");

    const entry = await resolveEntryFile({
      distPath: dir,
      label: "demo",
      packageFile: "index.bundle.js",
      packageFileMin: "index.min.js",
      packageName: "demo",
    } as any);

    expect(entry).toBe(join(dir, "index.bundle.js"));
  });

  test("resolveEntryFile falls back to packageFileMin", async () => {
    const dir = await mkdtemp(join(tmpdir(), "benchmark-entry-fallback-"));
    await writeFile(join(dir, "index.min.js"), "min");

    const entry = await resolveEntryFile({
      distPath: dir,
      label: "demo",
      packageFile: "index.bundle.js",
      packageFileMin: "index.min.js",
      packageName: "demo",
    } as any);

    expect(entry).toBe(join(dir, "index.min.js"));
  });

  test("pickMinified prefers explicit packageFileMin", () => {
    const distPath = join(tmpdir(), "benchmark-min-choose");
    const minPath = join(distPath, "index.custom.min.js");
    const files = [
      { path: join(distPath, "index.bundle.js"), size: 4 },
      { path: minPath, size: 6 },
    ];

    const selected = pickMinified(files, {
      distPath,
      label: "demo",
      packageFile: "index.bundle.js",
      packageFileMin: "index.custom.min.js",
      packageName: "demo",
    } as any);

    expect(selected?.path).toBe(minPath);
  });

  test("buildBenchmarkSections renders single merged size and perf tables", () => {
    const sections = buildBenchmarkSections(
      [
        {
          distPath: "/tmp/dist",
          fileCount: 3,
          label: "@chr33s/pdf",
          minifiedGzipBytes: 1024,
          minifiedBytes: 2048,
          minifiedPath: "/tmp/dist/index.min.js",
          totalBytes: 4096,
        },
        {
          distPath: "/tmp/dist/pdf-lib",
          fileCount: 2,
          label: "pdf-lib",
          minifiedGzipBytes: 512,
          minifiedBytes: 1024,
          minifiedPath: "/tmp/dist/pdf-lib/index.min.js",
          totalBytes: 2048,
        },
        {
          distPath: "/tmp/dist/fontkit",
          fileCount: 2,
          label: "@chr33s/pdf-fontkit",
          minifiedGzipBytes: 256,
          minifiedBytes: 512,
          minifiedPath: "/tmp/dist/fontkit/index.min.js",
          totalBytes: 1024,
        },
        {
          distPath: "/tmp/dist/pdf-lib-fontkit",
          fileCount: 2,
          label: "@pdf-lib/fontkit",
          minifiedGzipBytes: 128,
          minifiedBytes: 256,
          minifiedPath: "/tmp/dist/pdf-lib-fontkit/index.min.js",
          totalBytes: 512,
        },
      ],
      [
        {
          cold: { max: 2, mean: 2, median: 2, min: 2, p95: 2 },
          label: "@chr33s/pdf",
          peakHeap: 2048,
          peakRss: 4096,
          rssCold: { max: 20, mean: 10, median: 10, min: 5, p95: 20 },
          rssWarm: { max: 10, mean: 8, median: 8, min: 6, p95: 10 },
          runs: 2,
          warmThroughput: 2,
          warm: { max: 1, mean: 1, median: 1, min: 1, p95: 1 },
        },
        {
          cold: { max: 4, mean: 4, median: 4, min: 4, p95: 4 },
          label: "pdf-lib",
          peakHeap: 4096,
          peakRss: 8192,
          rssCold: { max: 40, mean: 20, median: 20, min: 10, p95: 40 },
          rssWarm: { max: 20, mean: 16, median: 16, min: 12, p95: 20 },
          runs: 2,
          warmThroughput: 1,
          warm: { max: 2, mean: 2, median: 2, min: 2, p95: 2 },
        },
        {
          cold: { max: 6, mean: 6, median: 6, min: 6, p95: 6 },
          label: "@chr33s/pdf-fontkit",
          peakHeap: 8192,
          peakRss: 16384,
          rssCold: { max: 60, mean: 30, median: 30, min: 15, p95: 60 },
          rssWarm: { max: 30, mean: 24, median: 24, min: 18, p95: 30 },
          runs: 2,
          warmThroughput: 0.5,
          warm: { max: 3, mean: 3, median: 3, min: 3, p95: 3 },
        },
        {
          cold: { max: 8, mean: 8, median: 8, min: 8, p95: 8 },
          label: "@pdf-lib/fontkit",
          peakHeap: 12288,
          peakRss: 24576,
          rssCold: { max: 80, mean: 40, median: 40, min: 20, p95: 80 },
          rssWarm: { max: 40, mean: 32, median: 32, min: 24, p95: 40 },
          runs: 2,
          warmThroughput: 0.25,
          warm: { max: 4, mean: 4, median: 4, min: 4, p95: 4 },
        },
      ],
    );

    const headerCount =
      sections.sizeDepsSection.match(/\| Name \| Size \| min \| min\.gz \|/g)?.length ?? 0;
    expect(headerCount).toBe(1);
    expect(sections.sizeDepsSection).toContain("min.gz");
    expect(sections.sizeDepsSection).toContain("@chr33s/pdf");
    expect(sections.sizeDepsSection).toContain("pdf-lib");
    expect(sections.sizeDepsSection).toContain("@chr33s/pdf-fontkit");
    expect(sections.sizeDepsSection).toContain("@pdf-lib/fontkit");
    expect(sections.sizeDepsSection).toContain("Δ");
    expect(sections.sizeDepsSection).toContain("+2.00 KB (+100.0%)");

    const perfHeaderCount =
      sections.perfSection.match(
        /\| Name \| cold avg \(ms\) \| warm avg \(ms\) \| warm median \(ms\) \| warm p95 \(ms\) \| warm rss Δ avg \| warm throughput \(ops\/s\) \| peak RSS \| peak heap \|/g,
      )?.length ?? 0;
    expect(perfHeaderCount).toBe(1);
    expect(sections.perfSection).toContain("@chr33s/pdf");
    expect(sections.perfSection).toContain("pdf-lib");
    expect(sections.perfSection).toContain("@chr33s/pdf-fontkit");
    expect(sections.perfSection).toContain("@pdf-lib/fontkit");
    expect(sections.perfSection).toContain("warm throughput");
    expect(sections.perfSection).toContain("Δ");
    expect(sections.perfSection).toContain("-50.0%");
  });
});
