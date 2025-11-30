import { describe, expect, test } from "vitest";
import { BlowfishHelper, Hex, SHA256 } from "../src/index.js";

describe("Blowfish", () => {
  const saltA = Hex.parse("AA00000000000000");

  describe("encrypt", () => {
    test("should encrypt with password and salt", () => {
      const encrypted = BlowfishHelper.encrypt("Test", "pass", {
        salt: saltA,
        hasher: SHA256,
      }).toString();
      expect(encrypted).toBe("U2FsdGVkX1+qAAAAAAAAAKTIU8MPrBdH");
    });
  });

  describe("decrypt", () => {
    test("should decrypt with password", () => {
      const encrypted = BlowfishHelper.encrypt("Test", "pass", {
        salt: saltA,
        hasher: SHA256,
      }).toString();
      const decrypted = BlowfishHelper.decrypt(encrypted, "pass", {
        hasher: SHA256,
      });
      expect(decrypted.toString(Hex)).toBeDefined();
    });
  });
});
