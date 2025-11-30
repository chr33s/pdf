import { describe, expect, test } from "vitest";
import { X64Word } from "../src/index.js";

describe("X64Word", () => {
  describe("create", () => {
    test("should initialize with high and low words", () => {
      const word = new X64Word(0x00010203, 0x04050607);

      expect(word.high).toBe(0x00010203);
      expect(word.low).toBe(0x04050607);
    });
  });

  describe("clone", () => {
    test("should create independent copy", () => {
      const word = new X64Word(0x00010203, 0x04050607);
      const clone = word.clone();

      // Modify clone
      clone.high = 0;
      clone.low = 0;

      // Original should be unchanged
      expect(word.high).toBe(0x00010203);
      expect(word.low).toBe(0x04050607);
    });
  });
});
