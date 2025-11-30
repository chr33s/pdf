import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { Iso10126, WordArray } from "../src/index.js";

describe("Iso10126 Padding", () => {
  let originalRandom: typeof WordArray.random;

  beforeEach(() => {
    // Save original random method
    originalRandom = WordArray.random.bind(WordArray);

    // Replace random method with one that returns a predictable value
    WordArray.random = (nBytes: number): WordArray => {
      const words: number[] = [];
      for (let i = 0; i < nBytes; i += 4) {
        words.push(0x11223344);
      }
      return new WordArray(words, nBytes);
    };
  });

  afterEach(() => {
    // Restore random method
    WordArray.random = originalRandom;
  });

  describe("pad", () => {
    test("should pad data correctly", () => {
      const data = new WordArray([0xdddddd00], 3);
      Iso10126.pad(data, 2);

      expect(data.toString()).toBe(new WordArray([0xdddddd11, 0x22334405]).toString());
    });

    test("should pad and clamp correctly", () => {
      const data = new WordArray([0xdddddddd, 0xdddddddd], 3);
      Iso10126.pad(data, 2);

      expect(data.toString()).toBe(new WordArray([0xdddddd11, 0x22334405]).toString());
    });
  });

  describe("unpad", () => {
    test("should unpad data correctly", () => {
      const data = new WordArray([0xdddddd11, 0x22334405]);
      Iso10126.unpad(data);

      expect(data.toString()).toBe(new WordArray([0xdddddd00], 3).toString());
    });
  });
});
