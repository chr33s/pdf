import { describe, expect, test } from "vitest";
import UnicodeTrieBuilder from "../src/builder.js";

describe("UnicodeTrieBuilder", () => {
  describe("constructor", () => {
    test("should accept null initial value", () => {
      const builder = new UnicodeTrieBuilder(null, 0);
      expect(builder.get(0x0100)).toBe(0);
    });

    test("should accept null error value", () => {
      const builder = new UnicodeTrieBuilder(0, null);
      expect(builder.get(-1)).toBe(0);
    });

    test("should use default values when not provided", () => {
      const builder = new UnicodeTrieBuilder();
      expect(builder.get(0x0100)).toBe(0);
      expect(builder.get(-1)).toBe(0);
    });
  });

  describe("set", () => {
    test("should set values for individual code points", () => {
      const builder = new UnicodeTrieBuilder(0, 0);
      builder.set(0x0041, 1);
      builder.set(0x0042, 2);
      builder.set(0x0043, 3);

      expect(builder.get(0x0041)).toBe(1);
      expect(builder.get(0x0042)).toBe(2);
      expect(builder.get(0x0043)).toBe(3);
    });

    test("should overwrite previous values", () => {
      const builder = new UnicodeTrieBuilder(0, 0);
      builder.set(0x0041, 100);
      expect(builder.get(0x0041)).toBe(100);

      builder.set(0x0041, 200);
      expect(builder.get(0x0041)).toBe(200);
    });

    test("should handle supplementary plane code points", () => {
      const builder = new UnicodeTrieBuilder(0, 0);
      builder.set(0x1f600, 128512); // Emoji code point

      expect(builder.get(0x1f600)).toBe(128512);
    });
  });

  describe("setRange", () => {
    test("should set range without overwrite", () => {
      const builder = new UnicodeTrieBuilder(0, 0);
      builder.set(0x50, 99);
      builder.setRange(0x40, 0x60, 50, false);

      // Existing value should not be overwritten
      expect(builder.get(0x50)).toBe(99);
      // Other values in range should be set
      expect(builder.get(0x40)).toBe(50);
      expect(builder.get(0x60)).toBe(50);
    });

    test("should set range with overwrite", () => {
      const builder = new UnicodeTrieBuilder(0, 0);
      builder.set(0x50, 99);
      builder.setRange(0x40, 0x60, 50, true);

      // Existing value should be overwritten
      expect(builder.get(0x50)).toBe(50);
      expect(builder.get(0x40)).toBe(50);
      expect(builder.get(0x60)).toBe(50);
    });

    test("should handle single code point range", () => {
      const builder = new UnicodeTrieBuilder(0, 0);
      builder.setRange(0x100, 0x100, 42, true);

      expect(builder.get(0x100)).toBe(42);
      expect(builder.get(0x0ff)).toBe(0);
      expect(builder.get(0x101)).toBe(0);
    });

    test("should handle large ranges", () => {
      const builder = new UnicodeTrieBuilder(0, 0);
      builder.setRange(0x0, 0xffff, 1, true);

      expect(builder.get(0x0)).toBe(1);
      expect(builder.get(0x8000)).toBe(1);
      expect(builder.get(0xffff)).toBe(1);
      expect(builder.get(0x10000)).toBe(0); // Beyond range
    });
  });

  describe("freeze", () => {
    test("should return compacted trie", () => {
      const builder = new UnicodeTrieBuilder(10, 20);
      builder.set(0x1000, 100);

      const trie = builder.freeze();
      expect(trie.get(0x1000)).toBe(100);
      expect(trie.get(0x1001)).toBe(10);
      expect(trie.get(-1)).toBe(20);
    });

    test("should return same values as builder", () => {
      const builder = new UnicodeTrieBuilder(5, 999);
      builder.setRange(0x100, 0x1ff, 50, true);
      builder.set(0x150, 75);

      const trie = builder.freeze();

      for (let cp = 0x100; cp <= 0x1ff; cp++) {
        expect(trie.get(cp)).toBe(builder.get(cp));
      }
    });
  });

  describe("toBuffer", () => {
    test("should produce buffer that can be loaded", async () => {
      const builder = new UnicodeTrieBuilder(1, 2);
      builder.set(0x5000, 500);

      const buffer = await builder.toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(12); // Header is 12 bytes

      // Verify header values
      const highStart = buffer.readUInt32LE(0);
      const errorValue = buffer.readUInt32LE(4);
      expect(errorValue).toBe(2);
      expect(highStart).toBeGreaterThan(0);
    });

    test("should produce valid compressed output", async () => {
      const builder = new UnicodeTrieBuilder(0, 0);
      builder.setRange(0x0, 0xff, 1, true);

      const buffer = await builder.toBuffer();

      // Import UnicodeTrie to verify
      const { default: UnicodeTrie } = await import("../src/index.js");
      const trie = await UnicodeTrie.create(buffer);

      expect(trie.get(0x00)).toBe(1);
      expect(trie.get(0xff)).toBe(1);
      expect(trie.get(0x100)).toBe(0);
    });
  });
});
