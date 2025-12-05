import { describe, expect, test } from "vitest";
import { WordArray } from "../src/core.js";
import { default as sha256, SHA256 } from "../src/sha256.js";

describe("SHA256", () => {
  describe("hash vectors", () => {
    test("should hash empty string", () => {
      expect(sha256("").toString()).toBe(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      );
    });

    test('should hash "a"', () => {
      expect(sha256("a").toString()).toBe(
        "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
      );
    });

    test('should hash "abc"', () => {
      expect(sha256("abc").toString()).toBe(
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      );
    });

    test('should hash "message digest"', () => {
      expect(sha256("message digest").toString()).toBe(
        "f7846f55cf23e14eebeab5b4e1550cad5b509e3348fbc4efa3a1413d393cb650",
      );
    });

    test("should hash alphabet", () => {
      expect(sha256("abcdefghijklmnopqrstuvwxyz").toString()).toBe(
        "71c480df93d6ae2f1efad1447c66c9525e316218cf51fc8d9ed832f2daf18b73",
      );
    });

    test("should hash long string", () => {
      expect(sha256("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq").toString()).toBe(
        "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
      );
    });
  });

  describe("update and long message", () => {
    test("should handle progressive updates", () => {
      const hasher = new SHA256();
      for (let i = 0; i < 100; i++) {
        hasher.update("12345678901234567890123456789012345678901234567890");
      }

      expect(hasher.finalize().toString()).toBe(
        "f8146961d9b73d8da49ccd526fca65439cdd5b402f76971556d5f52fd129843e",
      );
    });
  });

  describe("clone", () => {
    test("should clone correctly", () => {
      const hasher = new SHA256();

      expect(hasher.update("a").clone().finalize().toString()).toBe(sha256("a").toString());
      expect(hasher.update("b").clone().finalize().toString()).toBe(sha256("ab").toString());
      expect(hasher.update("c").clone().finalize().toString()).toBe(sha256("abc").toString());
    });
  });

  describe("input integrity", () => {
    test("should not modify input", () => {
      const message = new WordArray([0x12345678]);
      const expected = message.toString();

      sha256(message);

      expect(message.toString()).toBe(expected);
    });
  });

  describe("helper", () => {
    test("should produce same result as class", () => {
      expect(new SHA256().finalize("").toString()).toBe(sha256("").toString());
    });
  });
});
