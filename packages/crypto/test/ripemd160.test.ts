import { describe, expect, test } from "vitest";
import { ripemd160, WordArray } from "../src/index.js";

describe("RIPEMD160", () => {
  describe("hash vectors", () => {
    test("should hash quick brown fox", () => {
      expect(ripemd160("The quick brown fox jumps over the lazy dog").toString()).toBe(
        "37f332f68db77bd9d7edd4969571ad671cf9dd3b",
      );
    });

    test("should hash quick brown fox with cog", () => {
      expect(ripemd160("The quick brown fox jumps over the lazy cog").toString()).toBe(
        "132072df690933835eb8b6ad0b77e7b6f14acad7",
      );
    });

    test("should hash empty string", () => {
      expect(ripemd160("").toString()).toBe("9c1185a5c5e9fc54612808977ee8f548b2258d31");
    });
  });

  describe("input integrity", () => {
    test("should not modify input", () => {
      const message = new WordArray([0x12345678]);
      const expected = message.toString();

      ripemd160(message);

      expect(message.toString()).toBe(expected);
    });
  });
});
