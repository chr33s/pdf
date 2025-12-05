import { describe, expect, test } from "vitest";
import { default as md5, MD5 } from "../src/md5.js";

import { WordArray } from "../src/core.js";

describe("MD5", () => {
  describe("hash vectors", () => {
    test("should hash empty string", () => {
      expect(md5("").toString()).toBe("d41d8cd98f00b204e9800998ecf8427e");
    });

    test('should hash "a"', () => {
      expect(md5("a").toString()).toBe("0cc175b9c0f1b6a831c399e269772661");
    });

    test('should hash "abc"', () => {
      expect(md5("abc").toString()).toBe("900150983cd24fb0d6963f7d28e17f72");
    });

    test('should hash "message digest"', () => {
      expect(md5("message digest").toString()).toBe("f96b697d7cb7938d525a2f31aaf161d0");
    });

    test("should hash alphabet", () => {
      expect(md5("abcdefghijklmnopqrstuvwxyz").toString()).toBe("c3fcd3d76192e4007dfb496cca67e13b");
    });

    test("should hash alphanumeric", () => {
      expect(md5("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789").toString()).toBe(
        "d174ab98d277d9f5a5611c2c9f419d9f",
      );
    });

    test("should hash repeated digits", () => {
      expect(
        md5(
          "12345678901234567890123456789012345678901234567890123456789012345678901234567890",
        ).toString(),
      ).toBe("57edf4a22be3c955ac49da2e2107b67a");
    });
  });

  describe("update and long message", () => {
    test("should handle progressive updates", () => {
      const hasher = new MD5();
      for (let i = 0; i < 100; i++) {
        hasher.update("12345678901234567890123456789012345678901234567890");
      }

      expect(hasher.finalize().toString()).toBe("7d017545e0268a6a12f2b507871d0429");
    });
  });

  describe("clone", () => {
    test("should clone correctly", () => {
      const hasher = new MD5();

      expect(hasher.update("a").clone().finalize().toString()).toBe(md5("a").toString());
      expect(hasher.update("b").clone().finalize().toString()).toBe(md5("ab").toString());
      expect(hasher.update("c").clone().finalize().toString()).toBe(md5("abc").toString());
    });
  });

  describe("input integrity", () => {
    test("should not modify input", () => {
      const message = new WordArray([0x12345678]);
      const expected = message.toString();

      md5(message);

      expect(message.toString()).toBe(expected);
    });
  });

  describe("helper", () => {
    test("should produce same result as class", () => {
      expect(new MD5().finalize("").toString()).toBe(md5("").toString());
    });
  });
});
