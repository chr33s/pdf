import { beforeEach, describe, expect, test } from "vitest";
import {
  AES,
  CBC,
  CipherParams,
  OpenSSLFormatter,
  Pkcs7,
  SerializableCipher,
  WordArray,
} from "../src/index.js";

describe("SerializableCipher", () => {
  let message: WordArray;
  let key: WordArray;
  let iv: WordArray;

  beforeEach(() => {
    message = new WordArray([0x00010203, 0x04050607, 0x08090a0b, 0x0c0d0e0f]);
    key = new WordArray([0x10111213, 0x14151617, 0x18191a1b, 0x1c1d1e1f]);
    iv = new WordArray([0x20212223, 0x24252627, 0x28292a2b, 0x2c2d2e2f]);
  });

  describe("encrypt", () => {
    test("should encrypt and return CipherParams", () => {
      // Compute expected
      const aes = AES.createEncryptor(key, { iv });
      const ciphertext = aes.finalize(message);
      const expected = new CipherParams({
        ciphertext,
        key,
        iv,
        algorithm: AES,
        mode: CBC,
        padding: Pkcs7,
        blockSize: 4,
        formatter: OpenSSLFormatter,
      });

      // Compute actual
      const actual = SerializableCipher.encrypt(AES, message, key, { iv });

      // Test
      expect(actual.toString()).toBe(expected.toString());
      expect(actual.ciphertext!.toString()).toBe(expected.ciphertext!.toString());
      expect(actual.key!.toString()).toBe(expected.key!.toString());
      expect(actual.iv!.toString()).toBe(expected.iv!.toString());
      expect(actual.blockSize).toBe(expected.blockSize);
    });
  });

  describe("decrypt", () => {
    test("should decrypt ciphertext", () => {
      const encrypted = SerializableCipher.encrypt(AES, message, key, { iv }).toString();
      const decrypted = SerializableCipher.decrypt(AES, encrypted, key, { iv });

      expect(decrypted.toString()).toBe(message.toString());
    });
  });
});
