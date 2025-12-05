import { describe, expect, test } from "vitest";
import { AES, default as AESHelper } from "../src/aes.js";
import { CipherParams } from "../src/cipher-core.js";
import { Hex } from "../src/core.js";
import { ECB } from "../src/mode.js";
import { NoPadding } from "../src/padding.js";

describe("AES", () => {
  describe("encrypt", () => {
    test("should encrypt with 128-bit key", () => {
      const plaintext = Hex.parse("00112233445566778899aabbccddeeff");
      const key = Hex.parse("000102030405060708090a0b0c0d0e0f");

      const result = AESHelper.encrypt(plaintext, key, {
        mode: ECB,
        padding: NoPadding,
      });

      expect(result.ciphertext!.toString()).toBe("69c4e0d86a7b0430d8cdb78070b4c55a");
    });

    test("should encrypt with 192-bit key", () => {
      const plaintext = Hex.parse("00112233445566778899aabbccddeeff");
      const key = Hex.parse("000102030405060708090a0b0c0d0e0f1011121314151617");

      const result = AESHelper.encrypt(plaintext, key, {
        mode: ECB,
        padding: NoPadding,
      });

      expect(result.ciphertext!.toString()).toBe("dda97ca4864cdfe06eaf70a0ec0d7191");
    });

    test("should encrypt with 256-bit key", () => {
      const plaintext = Hex.parse("00112233445566778899aabbccddeeff");
      const key = Hex.parse("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");

      const result = AESHelper.encrypt(plaintext, key, {
        mode: ECB,
        padding: NoPadding,
      });

      expect(result.ciphertext!.toString()).toBe("8ea2b7ca516745bfeafc49904b496089");
    });
  });

  describe("decrypt", () => {
    test("should decrypt with 128-bit key", () => {
      const ciphertext = new CipherParams({
        ciphertext: Hex.parse("69c4e0d86a7b0430d8cdb78070b4c55a"),
      });
      const key = Hex.parse("000102030405060708090a0b0c0d0e0f");

      const result = AESHelper.decrypt(ciphertext, key, {
        mode: ECB,
        padding: NoPadding,
      });

      expect(result.toString()).toBe("00112233445566778899aabbccddeeff");
    });

    test("should decrypt with 192-bit key", () => {
      const ciphertext = new CipherParams({
        ciphertext: Hex.parse("dda97ca4864cdfe06eaf70a0ec0d7191"),
      });
      const key = Hex.parse("000102030405060708090a0b0c0d0e0f1011121314151617");

      const result = AESHelper.decrypt(ciphertext, key, {
        mode: ECB,
        padding: NoPadding,
      });

      expect(result.toString()).toBe("00112233445566778899aabbccddeeff");
    });

    test("should decrypt with 256-bit key", () => {
      const ciphertext = new CipherParams({
        ciphertext: Hex.parse("8ea2b7ca516745bfeafc49904b496089"),
      });
      const key = Hex.parse("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");

      const result = AESHelper.decrypt(ciphertext, key, {
        mode: ECB,
        padding: NoPadding,
      });

      expect(result.toString()).toBe("00112233445566778899aabbccddeeff");
    });
  });

  describe("multi-part", () => {
    test("should process data in multiple parts", () => {
      const key = Hex.parse("000102030405060708090a0b0c0d0e0f");
      const aes = AES.createEncryptor(key, {
        mode: ECB,
        padding: NoPadding,
      });

      const ciphertext1 = aes.process(Hex.parse("001122334455"));
      const ciphertext2 = aes.process(Hex.parse("66778899aa"));
      const ciphertext3 = aes.process(Hex.parse("bbccddeeff"));
      const ciphertext4 = aes.finalize();

      const result = ciphertext1.concat(ciphertext2).concat(ciphertext3).concat(ciphertext4);
      expect(result.toString()).toBe("69c4e0d86a7b0430d8cdb78070b4c55a");
    });
  });

  describe("input integrity", () => {
    test("should not modify input", () => {
      const message = Hex.parse("00112233445566778899aabbccddeeff");
      const key = Hex.parse("000102030405060708090a0b0c0d0e0f");
      const iv = Hex.parse("101112131415161718191a1b1c1d1e1f");

      const expectedMessage = message.toString();
      const expectedKey = key.toString();
      const expectedIv = iv.toString();

      AESHelper.encrypt(message, key, { iv });

      expect(message.toString()).toBe(expectedMessage);
      expect(key.toString()).toBe(expectedKey);
      expect(iv.toString()).toBe(expectedIv);
    });
  });
});
