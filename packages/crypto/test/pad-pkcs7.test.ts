import { describe, expect, test } from "vitest";
import { Pkcs7, WordArray } from "../src/index.js";

describe("Pkcs7 Padding", () => {
  describe("pad", () => {
    test("should pad data correctly", () => {
      const data = new WordArray([0xdddddd00], 3);
      Pkcs7.pad(data, 2);

      expect(data.toString()).toBe(new WordArray([0xdddddd05, 0x05050505]).toString());
    });

    test("should pad and clamp correctly", () => {
      const data = new WordArray([0xdddddddd, 0xdddddddd], 3);
      Pkcs7.pad(data, 2);

      expect(data.toString()).toBe(new WordArray([0xdddddd05, 0x05050505]).toString());
    });
  });

  describe("unpad", () => {
    test("should unpad data correctly", () => {
      const data = new WordArray([0xdddddd05, 0x05050505]);
      Pkcs7.unpad(data);

      expect(data.toString()).toBe(new WordArray([0xdddddd00], 3).toString());
    });
  });
});
