import { beforeEach, describe, expect, test } from "vitest";
import { AES, default as AESHelper } from "../src/aes.js";
import { WordArray } from "../src/core.js";
import { ECB } from "../src/mode.js";
import { NoPadding } from "../src/padding.js";

describe("ECB Mode", () => {
  let message: WordArray;
  let key: WordArray;

  beforeEach(() => {
    message = new WordArray([
      0x00010203, 0x04050607, 0x08090a0b, 0x0c0d0e0f, 0x10111213, 0x14151617, 0x18191a1b,
      0x1c1d1e1f,
    ]);
    key = new WordArray([0x20212223, 0x24252627, 0x28292a2b, 0x2c2d2e2f]);
  });

  describe("encryptor", () => {
    test("should encrypt correctly with ECB mode", () => {
      // Compute expected - each block encrypted independently
      const expected = message.clone();
      const aes = AES.createEncryptor(key);
      aes.encryptBlock(expected.words, 0);
      aes.encryptBlock(expected.words, 4);

      // Compute actual
      const actual = AESHelper.encrypt(message, key, {
        mode: ECB,
        padding: NoPadding,
      }).ciphertext;

      expect(actual!.toString()).toBe(expected.toString());
    });
  });

  describe("decryptor", () => {
    test("should decrypt correctly with ECB mode", () => {
      const encrypted = AESHelper.encrypt(message, key, {
        mode: ECB,
        padding: NoPadding,
      });
      const decrypted = AESHelper.decrypt(encrypted, key, {
        mode: ECB,
        padding: NoPadding,
      });

      expect(decrypted.toString()).toBe(message.toString());
    });
  });
});
