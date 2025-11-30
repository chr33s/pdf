import { describe, expect, test } from "vitest";
import { Utf8, WordArray } from "../src/index.js";

describe("Utf8 encoder", () => {
  describe("stringify", () => {
    test("should stringify 1-byte character ($)", () => {
      expect(Utf8.stringify(new WordArray([0x24000000], 1))).toBe("$");
    });

    test("should stringify 2-byte character (¢)", () => {
      expect(Utf8.stringify(new WordArray([0xc2a20000], 2))).toBe("¢");
    });

    test("should stringify 3-byte character (€)", () => {
      expect(Utf8.stringify(new WordArray([0xe282ac00], 3))).toBe("€");
    });

    test("should stringify 4-byte character (𤭢)", () => {
      expect(Utf8.stringify(new WordArray([0xf0a4ada2], 4))).toBe("𤭢");
    });
  });

  describe("parse", () => {
    test("should parse 1-byte character ($)", () => {
      expect(Utf8.parse("$").toString()).toBe(new WordArray([0x24000000], 1).toString());
    });

    test("should parse 2-byte character (¢)", () => {
      expect(Utf8.parse("¢").toString()).toBe(new WordArray([0xc2a20000], 2).toString());
    });

    test("should parse 3-byte character (€)", () => {
      expect(Utf8.parse("€").toString()).toBe(new WordArray([0xe282ac00], 3).toString());
    });

    test("should parse 4-byte character (𤭢)", () => {
      expect(Utf8.parse("𤭢").toString()).toBe(new WordArray([0xf0a4ada2], 4).toString());
    });
  });
});
