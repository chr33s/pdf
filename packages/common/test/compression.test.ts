import { describe, expect, test } from "vitest";
import { deflate, inflate } from "../src/compression.js";

const testData = new TextEncoder().encode("Hello, World! This is a test string for compression.");
const largeData = new Uint8Array(10_000).fill(65); // 10KB of 'A's

describe("deflate/inflate", () => {
  test("should compress and decompress data", async () => {
    const compressed = await deflate(testData);
    // Small data may not compress smaller due to overhead
    expect(compressed.length).toBeGreaterThan(0);

    const decompressed = await inflate(compressed);
    expect(decompressed).toEqual(testData);
  });

  test("should handle large data", async () => {
    const compressed = await deflate(largeData);
    expect(compressed.length).toBeLessThan(largeData.length);

    const decompressed = await inflate(compressed);
    expect(decompressed).toEqual(largeData);
  });

  test("should handle empty data", async () => {
    const emptyData = new Uint8Array(0);
    const compressed = await deflate(emptyData);
    const decompressed = await inflate(compressed);
    expect(decompressed).toEqual(emptyData);
  });

  test("should achieve good compression on repetitive data", async () => {
    const repetitiveData = new TextEncoder().encode("AAAAAAAAAAAAAAAAAAAA".repeat(100));
    const compressed = await deflate(repetitiveData);

    // Should achieve at least 50% compression on highly repetitive data
    expect(compressed.length).toBeLessThan(repetitiveData.length * 0.5);
  });
});

describe("deflateRaw/inflateRaw", () => {
  test("should compress and decompress data", async () => {
    const compressed = await deflate(testData, "deflate-raw");
    // Small data may not compress smaller due to overhead
    expect(compressed.length).toBeGreaterThan(0);

    const decompressed = await inflate(compressed, "deflate-raw");
    expect(decompressed).toEqual(testData);
  });

  test("should handle large data", async () => {
    const compressed = await deflate(largeData, "deflate-raw");
    expect(compressed.length).toBeLessThan(largeData.length);

    const decompressed = await inflate(compressed, "deflate-raw");
    expect(decompressed).toEqual(largeData);
  });

  test("should achieve good compression on repetitive data", async () => {
    const repetitiveData = new TextEncoder().encode("AAAAAAAAAAAAAAAAAAAA".repeat(100));
    const compressed = await deflate(repetitiveData, "deflate-raw");

    // Should achieve at least 50% compression on highly repetitive data
    expect(compressed.length).toBeLessThan(repetitiveData.length * 0.5);
  });
});

describe("gzip/gunzip", () => {
  test("should compress and decompress data", async () => {
    const compressed = await deflate(testData, "gzip");
    // gzip adds header, so small data won't be smaller
    expect(compressed.length).toBeGreaterThan(0);

    const decompressed = await inflate(compressed, "gzip");
    expect(decompressed).toEqual(testData);
  });

  test("should handle large data", async () => {
    const compressed = await deflate(largeData, "gzip");
    expect(compressed.length).toBeLessThan(largeData.length);

    const decompressed = await inflate(compressed, "gzip");
    expect(decompressed).toEqual(largeData);
  });

  test("should achieve good compression on repetitive data", async () => {
    const repetitiveData = new TextEncoder().encode("AAAAAAAAAAAAAAAAAAAA".repeat(100));
    const compressed = await deflate(repetitiveData, "gzip");

    // Should achieve at least 50% compression on highly repetitive data
    expect(compressed.length).toBeLessThan(repetitiveData.length * 0.5);
  });
});
