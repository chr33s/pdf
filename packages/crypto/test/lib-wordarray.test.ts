import { describe, expect, test } from "vitest";
import { Latin1, WordArray } from "../src/index.js";

describe("WordArray", () => {
  describe("init", () => {
    test("should initialize empty array", () => {
      expect(WordArray.create().toString()).toBe("");
    });

    test("should initialize with words", () => {
      expect(WordArray.create([0x12345678]).toString()).toBe("12345678");
    });

    test("should initialize with words and sigBytes", () => {
      expect(WordArray.create([0x12345678], 2).toString()).toBe("1234");
    });
  });

  describe("toString", () => {
    test("should use passed encoder", () => {
      expect(WordArray.create([0x12345678]).toString(Latin1)).toBe("\x12\x34\x56\x78");
    });

    test("should use default encoder (Hex)", () => {
      expect(WordArray.create([0x12345678]).toString()).toBe("12345678");
    });
  });

  describe("concat", () => {
    test("should concat with 3 sigBytes", () => {
      const wordArray1 = WordArray.create([0x12345678], 3);
      const wordArray2 = WordArray.create([0x12345678], 3);

      expect(wordArray1.concat(wordArray2).toString()).toBe("123456123456");
      expect(wordArray1.toString()).toBe("123456123456");
    });

    test("should concat with 4 sigBytes", () => {
      const wordArray1 = WordArray.create([0x12345678], 4);
      const wordArray2 = WordArray.create([0x12345678], 3);

      expect(wordArray1.concat(wordArray2).toString()).toBe("12345678123456");
      expect(wordArray1.toString()).toBe("12345678123456");
    });

    test("should concat with 5 sigBytes", () => {
      const wordArray1 = WordArray.create([0x12345678], 5);
      const wordArray2 = WordArray.create([0x12345678], 3);

      expect(wordArray1.concat(wordArray2).toString()).toBe("1234567800123456");
      expect(wordArray1.toString()).toBe("1234567800123456");
    });

    test("should concat long arrays", () => {
      const wordArray1 = WordArray.create();

      const wordArray2 = WordArray.create();
      const wordArray3 = WordArray.create();
      for (let i = 0; i < 1000; i++) {
        wordArray2.words[i] = i;
        wordArray3.words[i] = i;
      }
      wordArray2.sigBytes = wordArray3.sigBytes = 1000;

      const result = wordArray1.concat(wordArray2.concat(wordArray3));
      expect(result.sigBytes).toBe(2000);
    });
  });

  describe("clamp", () => {
    test("should clamp to sigBytes", () => {
      const wordArray = WordArray.create([0x12345678, 0x12345678], 3);
      wordArray.clamp();

      expect(wordArray.words.toString()).toBe([0x12345600].toString());
    });
  });

  describe("clone", () => {
    test("should create independent copy", () => {
      const wordArray = WordArray.create([0x12345678]);
      const clone = wordArray.clone();
      clone.words[0] = 0;

      expect(wordArray.toString()).not.toBe(clone.toString());
    });
  });

  describe("random", () => {
    test("should generate random arrays", () => {
      expect(WordArray.random(8).toString()).not.toBe(WordArray.random(8).toString());
      expect(WordArray.random(8).sigBytes).toBe(8);
    });
  });
});
