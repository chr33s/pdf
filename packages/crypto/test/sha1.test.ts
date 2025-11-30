import { describe, expect, test } from "vitest";
import { Hex, HMAC, HmacSHA1, SHA1, sha1, WordArray } from "../src/index.js";

describe("SHA1", () => {
  describe("hash vectors", () => {
    test("should hash empty string", () => {
      expect(sha1("").toString()).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
    });

    test('should hash "a"', () => {
      expect(sha1("a").toString()).toBe("86f7e437faa5a7fce15d1ddcb9eaeaea377667b8");
    });

    test('should hash "abc"', () => {
      expect(sha1("abc").toString()).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    });

    test('should hash "message digest"', () => {
      expect(sha1("message digest").toString()).toBe("c12252ceda8be8994d5fa0290a47231c1d16aae3");
    });

    test("should hash alphabet", () => {
      expect(sha1("abcdefghijklmnopqrstuvwxyz").toString()).toBe(
        "32d10c7b8cf96570ca04ce37f2a19d84240d3a89",
      );
    });

    test("should hash alphanumeric", () => {
      expect(
        sha1("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789").toString(),
      ).toBe("761c457bf73b14d27e9e9265c46f4b4dda11f940");
    });

    test("should hash repeated digits", () => {
      expect(
        sha1(
          "12345678901234567890123456789012345678901234567890123456789012345678901234567890",
        ).toString(),
      ).toBe("50abf5706a150990a08b2c5ea40fa0e585554732");
    });
  });

  describe("update and long message", () => {
    test("should handle progressive updates", () => {
      const hasher = new SHA1();
      for (let i = 0; i < 100; i++) {
        hasher.update("12345678901234567890123456789012345678901234567890");
      }

      expect(hasher.finalize().toString()).toBe("85e4c4b3933d5553ebf82090409a9d90226d845c");
    });
  });

  describe("clone", () => {
    test("should clone correctly", () => {
      const hasher = new SHA1();

      expect(hasher.update("a").clone().finalize().toString()).toBe(sha1("a").toString());
      expect(hasher.update("b").clone().finalize().toString()).toBe(sha1("ab").toString());
      expect(hasher.update("c").clone().finalize().toString()).toBe(sha1("abc").toString());
    });
  });

  describe("input integrity", () => {
    test("should not modify input", () => {
      const message = new WordArray([0x12345678]);
      const expected = message.toString();

      sha1(message);

      expect(message.toString()).toBe(expected);
    });
  });

  describe("helper", () => {
    test("should produce same result as class", () => {
      expect(new SHA1().finalize("").toString()).toBe(sha1("").toString());
    });
  });
});

describe("HmacSHA1", () => {
  test("should calculate HMAC correctly", () => {
    expect(
      new HMAC(SHA1, Hex.parse("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b")).finalize("Hi There").toString(),
    ).toBe(HmacSHA1("Hi There", Hex.parse("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b")).toString());
  });
});
