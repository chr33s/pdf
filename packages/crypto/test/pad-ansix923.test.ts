import { describe, expect, test } from "vitest";
import { AnsiX923, WordArray } from "../src/index.js";

describe("AnsiX923 Padding", () => {
  describe("pad", () => {
    test("should pad data correctly", () => {
      const data = new WordArray([0xdddddd00], 3);
      AnsiX923.pad(data, 2);

      expect(data.toString()).toBe(new WordArray([0xdddddd00, 0x00000005]).toString());
    });

    test("should pad and clamp correctly", () => {
      const data = new WordArray([0xdddddddd, 0xdddddddd], 3);
      AnsiX923.pad(data, 2);

      expect(data.toString()).toBe(new WordArray([0xdddddd00, 0x00000005]).toString());
    });
  });

  describe("unpad", () => {
    test("should unpad data correctly", () => {
      const data = new WordArray([0xdddddd00, 0x00000005]);
      AnsiX923.unpad(data);

      expect(data.toString()).toBe(new WordArray([0xdddddd00], 3).toString());
    });
  });
});
