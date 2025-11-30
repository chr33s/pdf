import { describe, expect, test } from "vitest";
import { Hex, WordArray } from "../src/index.js";

describe("Hex encoder", () => {
  describe("stringify", () => {
    test("should stringify WordArray to hex", () => {
      expect(Hex.stringify(new WordArray([0x12345678]))).toBe("12345678");
    });
  });

  describe("parse", () => {
    test("should parse hex string to WordArray", () => {
      expect(Hex.parse("12345678").toString()).toBe(new WordArray([0x12345678]).toString());
    });
  });
});
