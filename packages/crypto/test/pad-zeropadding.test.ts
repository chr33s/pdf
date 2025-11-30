import { describe, expect, test } from "vitest";
import { WordArray, ZeroPadding } from "../src/index.js";

describe("ZeroPadding", () => {
  describe("pad", () => {
    test("should pad data correctly", () => {
      const data = new WordArray([0xdddddd00], 3);
      ZeroPadding.pad(data, 2);

      expect(data.toString()).toBe(new WordArray([0xdddddd00, 0x00000000]).toString());
    });

    test("should pad and clamp correctly", () => {
      const data = new WordArray([0xdddddddd, 0xdddddddd], 3);
      ZeroPadding.pad(data, 2);

      expect(data.toString()).toBe(new WordArray([0xdddddd00, 0x00000000]).toString());
    });
  });

  describe("unpad", () => {
    test("should unpad data correctly", () => {
      const data = new WordArray([0xdddddd00, 0x00000000]);
      ZeroPadding.unpad(data);

      expect(data.toString()).toBe(new WordArray([0xdddddd00], 3).toString());
    });
  });
});
