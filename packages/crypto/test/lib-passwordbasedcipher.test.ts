import { describe, expect, test } from "vitest";
import { AES, PasswordBasedCipher, Utf8 } from "../src/index.js";

describe("PasswordBasedCipher", () => {
  describe("encrypt", () => {
    test("should encrypt with password and produce ciphertext", () => {
      // Compute actual
      const actual = PasswordBasedCipher.encrypt(AES, "Hello, World!", "password");

      // Verify that ciphertext was produced
      expect(actual.ciphertext).toBeDefined();
      expect(actual.ciphertext!.sigBytes).toBeGreaterThan(0);
      // Verify salt was generated
      expect(actual.salt).toBeDefined();
    });
  });

  describe("decrypt", () => {
    test("should decrypt with password", () => {
      const ciphertext = PasswordBasedCipher.encrypt(AES, "Hello, World!", "password");
      const plaintext = PasswordBasedCipher.decrypt(AES, ciphertext, "password");

      expect(plaintext.toString(Utf8)).toBe("Hello, World!");
    });
  });
});
