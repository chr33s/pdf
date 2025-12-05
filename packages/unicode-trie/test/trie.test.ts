import { describe, expect, test } from "vitest";
import UnicodeTrieBuilder from "../src/builder.js";
import UnicodeTrie from "../src/unicode-trie.js";

describe("UnicodeTrie", () => {
  describe("get", () => {
    test("should return errorValue for negative code points", async () => {
      const builder = new UnicodeTrieBuilder(0, 999);
      const trie = builder.freeze();
      expect(trie.get(-1)).toBe(999);
      expect(trie.get(-100)).toBe(999);
    });

    test("should return errorValue for code points above 0x10FFFF", async () => {
      const builder = new UnicodeTrieBuilder(0, 888);
      const trie = builder.freeze();
      expect(trie.get(0x110000)).toBe(888);
      expect(trie.get(0x200000)).toBe(888);
    });

    test("should handle BMP code points (0x0000-0xFFFF)", async () => {
      const builder = new UnicodeTrieBuilder(0, 0);
      builder.set(0x0041, 65); // 'A'
      builder.set(0x0061, 97); // 'a'
      builder.set(0x0000, 1); // NUL
      builder.set(0xffff, 2); // Last BMP

      const trie = builder.freeze();
      expect(trie.get(0x0041)).toBe(65);
      expect(trie.get(0x0061)).toBe(97);
      expect(trie.get(0x0000)).toBe(1);
      expect(trie.get(0xffff)).toBe(2);
    });

    test("should handle lead surrogate range (0xD800-0xDBFF)", async () => {
      const builder = new UnicodeTrieBuilder(0, 0);
      builder.set(0xd800, 100);
      builder.set(0xdbff, 101);

      const trie = builder.freeze();
      expect(trie.get(0xd800)).toBe(100);
      expect(trie.get(0xdbff)).toBe(101);
    });

    test("should handle supplementary code points (0x10000-0x10FFFF)", async () => {
      const builder = new UnicodeTrieBuilder(0, 0);
      builder.set(0x10000, 200); // First supplementary
      builder.set(0x1f600, 201); // Emoji
      builder.set(0x10ffff, 202); // Last valid

      const trie = builder.freeze();
      expect(trie.get(0x10000)).toBe(200);
      expect(trie.get(0x1f600)).toBe(201);
      expect(trie.get(0x10ffff)).toBe(202);
    });

    test("should return initial value for unset code points", async () => {
      const builder = new UnicodeTrieBuilder(42, 0);
      const trie = builder.freeze();

      expect(trie.get(0x0100)).toBe(42);
      expect(trie.get(0x5000)).toBe(42);
    });
  });

  describe("fromJSON", () => {
    test("should create trie from JSON object", async () => {
      const builder = new UnicodeTrieBuilder(10, 666);
      builder.set(0x0041, 100);
      const frozen = builder.freeze();

      const json = {
        data: frozen.data,
        highStart: frozen.highStart,
        errorValue: frozen.errorValue,
      };

      const trie = UnicodeTrie.fromJSON(json);
      expect(trie.get(0x0041)).toBe(100);
      expect(trie.get(0x0042)).toBe(10);
      expect(trie.get(-1)).toBe(666);
    });

    test("should accept Int32Array as data", () => {
      const data = new Int32Array([1, 2, 3, 4]);
      const json = {
        data,
        highStart: 0x110000,
        errorValue: 0,
      };

      const trie = UnicodeTrie.fromJSON(json);
      expect(trie.data).toBeInstanceOf(Uint32Array);
    });
  });

  describe("create", () => {
    test("should detect JSON format and use fromJSON", async () => {
      const builder = new UnicodeTrieBuilder(5, 500);
      builder.set(0x0100, 99);
      const frozen = builder.freeze();

      const json = {
        data: frozen.data,
        highStart: frozen.highStart,
        errorValue: frozen.errorValue,
      };

      const trie = await UnicodeTrie.create(json);
      expect(trie.get(0x0100)).toBe(99);
      expect(trie.get(-1)).toBe(500);
    });

    test("should detect buffer format and use fromBuffer", async () => {
      const builder = new UnicodeTrieBuilder(7, 700);
      builder.set(0x0200, 77);

      const buffer = await builder.toBuffer();
      const trie = await UnicodeTrie.create(buffer);

      expect(trie.get(0x0200)).toBe(77);
      expect(trie.get(-1)).toBe(700);
    });
  });
});
