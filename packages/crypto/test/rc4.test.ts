import { describe, expect, test } from "vitest";
import { Hex } from "../src/core.js";
import { RC4, default as RC4Helper } from "../src/rc4.js";

describe("RC4", () => {
  describe("encryption vectors", () => {
    test("should encrypt vector 1", () => {
      expect(
        RC4Helper.encrypt(
          Hex.parse("0000000000000000"),
          Hex.parse("0123456789abcdef"),
        ).ciphertext!.toString(),
      ).toBe("7494c2e7104b0879");
    });

    test("should encrypt vector 2", () => {
      expect(
        RC4Helper.encrypt(Hex.parse("dcee4cf92c"), Hex.parse("618a63d2fb")).ciphertext!.toString(),
      ).toBe("f13829c9de");
    });
  });

  describe("multi-part encryption", () => {
    test("should produce same result as single-pass", () => {
      const encryptor = RC4.createEncryptor(Hex.parse("0123456789abcdef"));
      const ciphertext1 = encryptor.process(Hex.parse("00000000"));
      const ciphertext2 = encryptor.process(Hex.parse("0000"));
      const ciphertext3 = encryptor.process(Hex.parse("0000"));
      const ciphertext4 = encryptor.finalize();

      expect(
        ciphertext1.concat(ciphertext2).concat(ciphertext3).concat(ciphertext4).toString(),
      ).toBe("7494c2e7104b0879");
    });
  });

  describe("input integrity", () => {
    test("should not modify inputs", () => {
      const message = Hex.parse("0000000000000000");
      const key = Hex.parse("0123456789abcdef");

      const expectedMessage = message.toString();
      const expectedKey = key.toString();

      RC4Helper.encrypt(message, key);

      expect(message.toString()).toBe(expectedMessage);
      expect(key.toString()).toBe(expectedKey);
    });
  });
});
