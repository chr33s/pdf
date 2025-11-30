import { describe, expect, test } from "vitest";
import { Latin1, WordArray } from "../src/index.js";

describe("Latin1 encoder", () => {
  describe("stringify", () => {
    test("should stringify WordArray to Latin1", () => {
      expect(Latin1.stringify(new WordArray([0x12345678]))).toBe("\x12\x34\x56\x78");
    });
  });

  describe("parse", () => {
    test("should parse Latin1 string to WordArray", () => {
      expect(Latin1.parse("\x12\x34\x56\x78").toString()).toBe(
        new WordArray([0x12345678]).toString(),
      );
    });
  });
});
