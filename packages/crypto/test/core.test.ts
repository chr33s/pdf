import { describe, expect, test } from "vitest";
import { Hex, Latin1, Utf8, WordArray } from "../src/core.js";

describe("WordArray", () => {
  describe("create", () => {
    test("should create an empty WordArray", () => {
      const wordArray = new WordArray();
      expect(wordArray.toString()).toBe("");
    });

    test("should create WordArray with words", () => {
      const wordArray = new WordArray([0x12345678]);
      expect(wordArray.toString()).toBe("12345678");
    });

    test("should create WordArray with words and sigBytes", () => {
      const wordArray = new WordArray([0x12345678], 2);
      expect(wordArray.toString()).toBe("1234");
    });
  });

  describe("toString", () => {
    test("should use passed encoder", () => {
      const wordArray = new WordArray([0x12345678]);
      expect(wordArray.toString(Latin1)).toBe("\x12\x34\x56\x78");
    });

    test("should use default encoder (Hex)", () => {
      const wordArray = new WordArray([0x12345678]);
      expect(wordArray.toString()).toBe("12345678");
    });
  });

  describe("concat", () => {
    test("should concatenate with 3 sigBytes", () => {
      const wordArray1 = new WordArray([0x12345678], 3);
      const wordArray2 = new WordArray([0x12345678], 3);

      expect(wordArray1.concat(wordArray2).toString()).toBe("123456123456");
      expect(wordArray1.toString()).toBe("123456123456");
    });

    test("should concatenate with 4 sigBytes", () => {
      const wordArray1 = new WordArray([0x12345678], 4);
      const wordArray2 = new WordArray([0x12345678], 3);

      expect(wordArray1.concat(wordArray2).toString()).toBe("12345678123456");
      expect(wordArray1.toString()).toBe("12345678123456");
    });

    test("should concatenate with 5 sigBytes", () => {
      const wordArray1 = new WordArray([0x12345678], 5);
      const wordArray2 = new WordArray([0x12345678], 3);

      expect(wordArray1.concat(wordArray2).toString()).toBe("1234567800123456");
      expect(wordArray1.toString()).toBe("1234567800123456");
    });
  });

  describe("clamp", () => {
    test("should clamp words to sigBytes", () => {
      const wordArray = new WordArray([0x12345678, 0x12345678], 3);
      wordArray.clamp();

      expect(wordArray.words.toString()).toBe([0x12345600].toString());
    });
  });

  describe("clone", () => {
    test("should create independent copy", () => {
      const wordArray = new WordArray([0x12345678]);
      const clone = wordArray.clone();
      clone.words[0] = 0;

      expect(wordArray.toString()).not.toBe(clone.toString());
    });
  });

  describe("random", () => {
    test("should generate random bytes", () => {
      const random1 = WordArray.random(8);
      const random2 = WordArray.random(8);

      expect(random1.toString()).not.toBe(random2.toString());
    });

    test("should have correct sigBytes", () => {
      const random = WordArray.random(8);
      expect(random.sigBytes).toBe(8);
    });
  });
});

describe("Hex encoder", () => {
  describe("parse", () => {
    test("should parse hex string", () => {
      const wordArray = Hex.parse("12345678");
      expect(wordArray.words[0]).toBe(0x12345678);
      expect(wordArray.sigBytes).toBe(4);
    });
  });

  describe("stringify", () => {
    test("should stringify to hex", () => {
      const wordArray = new WordArray([0x12345678]);
      expect(Hex.stringify(wordArray)).toBe("12345678");
    });
  });
});

describe("Latin1 encoder", () => {
  describe("parse", () => {
    test("should parse Latin1 string", () => {
      const wordArray = Latin1.parse("\x12\x34\x56\x78");
      expect(wordArray.words[0]).toBe(0x12345678);
      expect(wordArray.sigBytes).toBe(4);
    });
  });

  describe("stringify", () => {
    test("should stringify to Latin1", () => {
      const wordArray = new WordArray([0x12345678]);
      expect(Latin1.stringify(wordArray)).toBe("\x12\x34\x56\x78");
    });
  });
});

describe("Utf8 encoder", () => {
  describe("parse", () => {
    test("should parse ASCII", () => {
      const wordArray = Utf8.parse("abc");
      expect(wordArray.toString()).toBe("616263");
    });

    test("should parse multi-byte UTF-8", () => {
      const wordArray = Utf8.parse("é");
      expect(wordArray.toString()).toBe("c3a9");
    });
  });

  describe("stringify", () => {
    test("should stringify ASCII", () => {
      const wordArray = Hex.parse("616263");
      expect(Utf8.stringify(wordArray)).toBe("abc");
    });
  });
});
