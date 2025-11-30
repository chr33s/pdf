import { describe, expect, test } from "vitest";
import { AESHelper, Hex, MD5, SHA1, SHA256, SHA512, Utf8 } from "../src/index.js";

describe("Config", () => {
  const saltA = Hex.parse("AA00000000000000");
  const saltB = Hex.parse("BB00000000000000");

  describe("encrypt", () => {
    test("should produce same ciphertext with same salt", () => {
      const encrypted1 = AESHelper.encrypt("Test", "Pass", { salt: saltA }).toString();
      const encrypted2 = AESHelper.encrypt("Test", "Pass", { salt: saltA }).toString();

      expect(encrypted1).toBe(encrypted2);
    });

    test("should produce different ciphertext with different salt", () => {
      const encryptedA = AESHelper.encrypt("Test", "Pass", { salt: saltA }).toString();
      const encryptedB = AESHelper.encrypt("Test", "Pass", { salt: saltB }).toString();

      expect(encryptedA).not.toBe(encryptedB);
    });
  });

  describe("decrypt", () => {
    test("should decrypt with correct password", () => {
      const encryptedA = AESHelper.encrypt("Test", "Pass", { salt: saltA });
      const encryptedB = AESHelper.encrypt("Test", "Pass", { salt: saltB });

      expect(AESHelper.decrypt(encryptedA, "Pass").toString(Utf8)).toBe("Test");
      expect(AESHelper.decrypt(encryptedB, "Pass").toString(Utf8)).toBe("Test");
    });
  });

  describe("custom KDF hasher", () => {
    test("should encrypt/decrypt with SHA1 hasher", () => {
      const encrypted = AESHelper.encrypt("Test", "Pass", {
        salt: saltA,
        hasher: SHA1,
      }).toString();
      const decrypted = AESHelper.decrypt(encrypted, "Pass", {
        hasher: SHA1,
      }).toString(Utf8);

      expect(decrypted).toBe("Test");
    });

    test("should encrypt/decrypt with SHA256 hasher", () => {
      const encrypted = AESHelper.encrypt("Test", "Pass", {
        salt: saltA,
        hasher: SHA256,
      }).toString();
      const decrypted = AESHelper.decrypt(encrypted, "Pass", {
        hasher: SHA256,
      }).toString(Utf8);

      expect(decrypted).toBe("Test");
    });

    test("should encrypt/decrypt with SHA512 hasher", () => {
      const encrypted = AESHelper.encrypt("Test", "Pass", {
        salt: saltA,
        hasher: SHA512,
      }).toString();
      const decrypted = AESHelper.decrypt(encrypted, "Pass", {
        hasher: SHA512,
      }).toString(Utf8);

      expect(decrypted).toBe("Test");
    });

    test("should use MD5 as default hasher", () => {
      const encryptedDefault = AESHelper.encrypt("Test", "Pass", {
        salt: saltA,
      }).toString();
      const encryptedMD5 = AESHelper.encrypt("Test", "Pass", {
        salt: saltA,
        hasher: MD5,
      }).toString();

      expect(encryptedDefault).toBe(encryptedMD5);
      expect(AESHelper.decrypt(encryptedMD5, "Pass", { hasher: MD5 }).toString(Utf8)).toBe("Test");
    });

    test("should produce different ciphertext with different hashers", () => {
      const encryptedDefault = AESHelper.encrypt("Test", "Pass", {
        salt: saltA,
      }).toString();
      const encryptedSHA1 = AESHelper.encrypt("Test", "Pass", {
        salt: saltA,
        hasher: SHA1,
      }).toString();
      const encryptedSHA256 = AESHelper.encrypt("Test", "Pass", {
        salt: saltA,
        hasher: SHA256,
      }).toString();
      const encryptedSHA512 = AESHelper.encrypt("Test", "Pass", {
        salt: saltA,
        hasher: SHA512,
      }).toString();

      expect(encryptedDefault).not.toBe(encryptedSHA1);
      expect(encryptedDefault).not.toBe(encryptedSHA256);
      expect(encryptedDefault).not.toBe(encryptedSHA512);
    });
  });
});
