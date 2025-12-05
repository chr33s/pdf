import { describe, expect, test } from "vitest";
import { Base64 } from "../src/base64.js";
import { WordArray } from "../src/core.js";

describe("Base64 encoder", () => {
  describe("stringify", () => {
    test("should stringify 0 bytes", () => {
      expect(Base64.stringify(new WordArray([0x666f6f62, 0x61720000], 0))).toBe("");
    });

    test("should stringify 1 byte", () => {
      expect(Base64.stringify(new WordArray([0x666f6f62, 0x61720000], 1))).toBe("Zg==");
    });

    test("should stringify 2 bytes", () => {
      expect(Base64.stringify(new WordArray([0x666f6f62, 0x61720000], 2))).toBe("Zm8=");
    });

    test("should stringify 3 bytes", () => {
      expect(Base64.stringify(new WordArray([0x666f6f62, 0x61720000], 3))).toBe("Zm9v");
    });

    test("should stringify 4 bytes", () => {
      expect(Base64.stringify(new WordArray([0x666f6f62, 0x61720000], 4))).toBe("Zm9vYg==");
    });

    test("should stringify 5 bytes", () => {
      expect(Base64.stringify(new WordArray([0x666f6f62, 0x61720000], 5))).toBe("Zm9vYmE=");
    });

    test("should stringify 6 bytes", () => {
      expect(Base64.stringify(new WordArray([0x666f6f62, 0x61720000], 6))).toBe("Zm9vYmFy");
    });

    test("should stringify 15 bytes with special chars", () => {
      expect(
        Base64.stringify(new WordArray([0x3e3e3e3f, 0x3f3f3e3e, 0x3e3f3f3f, 0x3d2f2b00], 15)),
      ).toBe("Pj4+Pz8/Pj4+Pz8/PS8r");
    });
  });

  describe("parse", () => {
    test("should parse empty string", () => {
      expect(Base64.parse("").toString()).toBe(
        new WordArray([0x666f6f62, 0x61720000], 0).toString(),
      );
    });

    test("should parse 1 byte", () => {
      expect(Base64.parse("Zg==").toString()).toBe(
        new WordArray([0x666f6f62, 0x61720000], 1).toString(),
      );
    });

    test("should parse 2 bytes", () => {
      expect(Base64.parse("Zm8=").toString()).toBe(
        new WordArray([0x666f6f62, 0x61720000], 2).toString(),
      );
    });

    test("should parse 3 bytes", () => {
      expect(Base64.parse("Zm9v").toString()).toBe(
        new WordArray([0x666f6f62, 0x61720000], 3).toString(),
      );
    });

    test("should parse 4 bytes", () => {
      expect(Base64.parse("Zm9vYg==").toString()).toBe(
        new WordArray([0x666f6f62, 0x61720000], 4).toString(),
      );
    });

    test("should parse 5 bytes", () => {
      expect(Base64.parse("Zm9vYmE=").toString()).toBe(
        new WordArray([0x666f6f62, 0x61720000], 5).toString(),
      );
    });

    test("should parse 6 bytes", () => {
      expect(Base64.parse("Zm9vYmFy").toString()).toBe(
        new WordArray([0x666f6f62, 0x61720000], 6).toString(),
      );
    });

    test("should parse 15 bytes with special chars", () => {
      expect(Base64.parse("Pj4+Pz8/Pj4+Pz8/PS8r").toString()).toBe(
        new WordArray([0x3e3e3e3f, 0x3f3f3e3e, 0x3e3f3f3f, 0x3d2f2b00], 15).toString(),
      );
    });
  });
});
