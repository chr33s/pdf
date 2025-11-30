import { describe, expect, test } from "vitest";
import { Utf16, Utf16BE, Utf16LE, WordArray } from "../src/index.js";

describe("Utf16 encoder", () => {
  describe("Utf16BE (Big Endian)", () => {
    test("should stringify", () => {
      expect(Utf16BE.stringify(new WordArray([0x00660069, 0x006c0074, 0x00650072], 12))).toBe(
        "filter",
      );
    });

    test("should parse", () => {
      expect(Utf16BE.parse("filter").toString()).toBe(
        new WordArray([0x00660069, 0x006c0074, 0x00650072], 12).toString(),
      );
    });
  });

  describe("Utf16LE (Little Endian)", () => {
    test("should stringify", () => {
      expect(Utf16LE.stringify(new WordArray([0x66006900, 0x6c007400, 0x65007200], 12))).toBe(
        "filter",
      );
    });

    test("should parse", () => {
      expect(Utf16LE.parse("filter").toString()).toBe(
        new WordArray([0x66006900, 0x6c007400, 0x65007200], 12).toString(),
      );
    });
  });

  describe("Utf16 (default to Big Endian)", () => {
    test("should stringify same as BE", () => {
      const wa = new WordArray([0x00660069, 0x006c0074, 0x00650072], 12);
      expect(Utf16.stringify(wa)).toBe(Utf16BE.stringify(wa));
    });

    test("should parse same as BE", () => {
      expect(Utf16.parse("filter").toString()).toBe(Utf16BE.parse("filter").toString());
    });
  });
});
