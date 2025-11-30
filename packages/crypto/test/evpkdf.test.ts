import { describe, expect, test } from "vitest";
import { EvpKDF, evpKDF, WordArray } from "../src/index.js";

describe("EvpKDF", () => {
  describe("key derivation", () => {
    test("should derive correct key", () => {
      expect(evpKDF("password", "saltsalt", { keySize: (256 + 128) / 32 }).toString()).toBe(
        "fdbdf3419fff98bdb0241390f62a9db35f4aba29d77566377997314ebfc709f20b5ca7b1081f94b1ac12e3c8ba87d05a",
      );
    });
  });

  describe("input integrity", () => {
    test("should not modify inputs", () => {
      const password = new WordArray([0x12345678]);
      const salt = new WordArray([0x12345678]);

      const expectedPassword = password.toString();
      const expectedSalt = salt.toString();

      evpKDF(password, salt);

      expect(password.toString()).toBe(expectedPassword);
      expect(salt.toString()).toBe(expectedSalt);
    });
  });

  describe("helper", () => {
    test("should produce same result as class", () => {
      expect(
        new EvpKDF({ keySize: (256 + 128) / 32 }).compute("password", "saltsalt").toString(),
      ).toBe(evpKDF("password", "saltsalt", { keySize: (256 + 128) / 32 }).toString());
    });
  });
});
