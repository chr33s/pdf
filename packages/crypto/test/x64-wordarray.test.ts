import { describe, expect, test } from "vitest";
import { X64Word, X64WordArray } from "../src/index.js";

describe("X64WordArray", () => {
  describe("create", () => {
    test("should create empty array", () => {
      expect(new X64WordArray().toX32().toString()).toBe("");
    });

    test("should create array with words", () => {
      const wordArray = new X64WordArray([
        new X64Word(0x00010203, 0x04050607),
        new X64Word(0x18191a1b, 0x1c1d1e1f),
      ]);

      expect(wordArray.toX32().toString()).toBe("000102030405060718191a1b1c1d1e1f");
    });

    test("should create array with words and sigBytes", () => {
      const wordArray = new X64WordArray(
        [new X64Word(0x00010203, 0x04050607), new X64Word(0x18191a1b, 0x1c1d1e1f)],
        10,
      );

      expect(wordArray.toX32().toString()).toBe("00010203040506071819");
    });
  });

  describe("toX32", () => {
    test("should convert to 32-bit word array", () => {
      const wordArray = new X64WordArray(
        [new X64Word(0x00010203, 0x04050607), new X64Word(0x18191a1b, 0x1c1d1e1f)],
        10,
      );

      expect(wordArray.toX32().toString()).toBe("00010203040506071819");
    });
  });

  describe("clone", () => {
    test("should create independent copy", () => {
      const wordArray = new X64WordArray([new X64Word(0x00010203, 0x04050607)]);
      const clone = wordArray.clone();

      // Modify clone
      clone.words[0].high = 0;

      // Original should be unchanged
      expect(wordArray.words[0].high).toBe(0x00010203);
    });
  });
});
