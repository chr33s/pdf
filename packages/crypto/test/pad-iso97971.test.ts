import { describe, expect, test } from "vitest";
import { Iso97971, WordArray } from "../src/index.js";

describe("Iso97971 Padding", () => {
  describe("pad", () => {
    test("should pad to 1 block", () => {
      const data = new WordArray([0xdddddd00], 3);
      Iso97971.pad(data, 1);

      expect(data.toString()).toBe(new WordArray([0xdddddd80]).toString());
    });

    test("should pad to 2 blocks", () => {
      const data = new WordArray([0xdddddd00], 3);
      Iso97971.pad(data, 2);

      expect(data.toString()).toBe(new WordArray([0xdddddd80, 0x00000000]).toString());
    });

    test("should pad and clamp correctly", () => {
      const data = new WordArray([0xdddddddd, 0xdddddddd], 3);
      Iso97971.pad(data, 2);

      expect(data.toString()).toBe(new WordArray([0xdddddd80, 0x00000000]).toString());
    });
  });

  describe("unpad", () => {
    test("should unpad data correctly", () => {
      const data = new WordArray([0xdddddd80, 0x00000000]);
      Iso97971.unpad(data);

      expect(data.toString()).toBe(new WordArray([0xdddddd00], 3).toString());
    });
  });
});
