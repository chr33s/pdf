import { beforeEach, describe, expect, test } from "vitest";
import { AES, AESHelper, CBC, NoPadding, WordArray } from "../src/index.js";

describe("CBC Mode", () => {
  let message: WordArray;
  let key: WordArray;
  let iv: WordArray;

  beforeEach(() => {
    message = new WordArray([
      0x00010203, 0x04050607, 0x08090a0b, 0x0c0d0e0f, 0x10111213, 0x14151617, 0x18191a1b,
      0x1c1d1e1f,
    ]);
    key = new WordArray([0x20212223, 0x24252627, 0x28292a2b, 0x2c2d2e2f]);
    iv = new WordArray([0x30313233, 0x34353637, 0x38393a3b, 0x3c3d3e3f]);
  });

  describe("encryptor", () => {
    test("should encrypt correctly with CBC mode", () => {
      // Compute expected
      const expected = message.clone();
      const aes = AES.createEncryptor(key);

      // First block XORed with IV, then encrypted
      for (let i = 0; i < 4; i++) {
        expected.words[i] ^= iv.words[i];
      }
      aes.encryptBlock(expected.words, 0);

      // Subsequent blocks XORed with previous encrypted block, then encrypted
      for (let i = 4; i < 8; i++) {
        expected.words[i] ^= expected.words[i - 4];
      }
      aes.encryptBlock(expected.words, 4);

      // Compute actual
      const actual = AESHelper.encrypt(message, key, {
        iv,
        mode: CBC,
        padding: NoPadding,
      }).ciphertext;

      expect(actual!.toString()).toBe(expected.toString());
    });
  });

  describe("decryptor", () => {
    test("should decrypt correctly with CBC mode", () => {
      const encrypted = AESHelper.encrypt(message, key, {
        iv,
        mode: CBC,
        padding: NoPadding,
      });
      const decrypted = AESHelper.decrypt(encrypted, key, {
        iv,
        mode: CBC,
        padding: NoPadding,
      });

      expect(decrypted.toString()).toBe(message.toString());
    });
  });
});
