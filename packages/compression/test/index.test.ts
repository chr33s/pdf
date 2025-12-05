import { describe, expect, test } from "vitest";
import { deflate, deflateRaw, gunzip, gzip, inflate, inflateRaw } from "../src/index.js";

describe("compression", () => {
  const testData = new TextEncoder().encode("Hello, World! This is a test string for compression.");
  const largeData = new Uint8Array(10000).fill(65); // 10KB of 'A's

  describe("deflate/inflate (zlib format)", () => {
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
  });

  describe("deflateRaw/inflateRaw (raw deflate format)", () => {
    test("should compress and decompress data", async () => {
      const compressed = await deflateRaw(testData);
      // Small data may not compress smaller due to overhead
      expect(compressed.length).toBeGreaterThan(0);

      const decompressed = await inflateRaw(compressed);
      expect(decompressed).toEqual(testData);
    });

    test("should handle large data", async () => {
      const compressed = await deflateRaw(largeData);
      expect(compressed.length).toBeLessThan(largeData.length);

      const decompressed = await inflateRaw(compressed);
      expect(decompressed).toEqual(largeData);
    });
  });

  describe("gzip/gunzip", () => {
    test("should compress and decompress data", async () => {
      const compressed = await gzip(testData);
      // gzip adds header, so small data won't be smaller
      expect(compressed.length).toBeGreaterThan(0);

      const decompressed = await gunzip(compressed);
      expect(decompressed).toEqual(testData);
    });
  });

  describe("compression ratio", () => {
    test("should achieve good compression on repetitive data", async () => {
      const repetitiveData = new TextEncoder().encode("AAAAAAAAAAAAAAAAAAAA".repeat(100));
      const compressed = await deflate(repetitiveData);

      // Should achieve at least 50% compression on highly repetitive data
      expect(compressed.length).toBeLessThan(repetitiveData.length * 0.5);
    });
  });
});
