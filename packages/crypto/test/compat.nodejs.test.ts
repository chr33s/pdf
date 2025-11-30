/**
 * Compatibility tests comparing @chr33s/crypto output with node:crypto.
 * These tests verify that our implementations produce the same results
 * as the native Node.js crypto module.
 */
import * as nodeCrypto from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  AESHelper,
  CBC,
  Hex,
  HmacMD5,
  HmacSHA1,
  HmacSHA256,
  HmacSHA384,
  HmacSHA512,
  MD5,
  Pkcs7,
  SHA1,
  SHA256,
  SHA384,
  SHA512,
  Utf8,
  md5,
  pbkdf2,
  sha1,
  sha256,
  sha384,
  sha512,
  typedArrayToWordArray,
} from "../src/index.js";

describe("node:crypto compatibility", () => {
  const testVectors = [
    "",
    "a",
    "abc",
    "message digest",
    "abcdefghijklmnopqrstuvwxyz",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    "12345678901234567890123456789012345678901234567890123456789012345678901234567890",
    "The quick brown fox jumps over the lazy dog",
    "Hello, World!",
    "🔐 Unicode test with émojis and spëcial çharacters",
  ];

  describe("MD5", () => {
    test.each(testVectors)('should match node:crypto for "%s"', (input) => {
      const nodeResult = nodeCrypto.createHash("md5").update(input).digest("hex");
      const cryptoJsResult = md5(input).toString(Hex);
      expect(cryptoJsResult).toBe(nodeResult);
    });

    test("should match for binary data", () => {
      const buffer = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
      const nodeResult = nodeCrypto.createHash("md5").update(buffer).digest("hex");
      const wordArray = typedArrayToWordArray(buffer);
      const cryptoJsResult = md5(wordArray).toString(Hex);
      expect(cryptoJsResult).toBe(nodeResult);
    });
  });

  describe("SHA1", () => {
    test.each(testVectors)('should match node:crypto for "%s"', (input) => {
      const nodeResult = nodeCrypto.createHash("sha1").update(input).digest("hex");
      const cryptoJsResult = sha1(input).toString(Hex);
      expect(cryptoJsResult).toBe(nodeResult);
    });

    test("should match for binary data", () => {
      const buffer = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
      const nodeResult = nodeCrypto.createHash("sha1").update(buffer).digest("hex");
      const wordArray = typedArrayToWordArray(buffer);
      const cryptoJsResult = sha1(wordArray).toString(Hex);
      expect(cryptoJsResult).toBe(nodeResult);
    });
  });

  describe("SHA256", () => {
    test.each(testVectors)('should match node:crypto for "%s"', (input) => {
      const nodeResult = nodeCrypto.createHash("sha256").update(input).digest("hex");
      const cryptoJsResult = sha256(input).toString(Hex);
      expect(cryptoJsResult).toBe(nodeResult);
    });

    test("should match for binary data", () => {
      const buffer = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
      const nodeResult = nodeCrypto.createHash("sha256").update(buffer).digest("hex");
      const wordArray = typedArrayToWordArray(buffer);
      const cryptoJsResult = sha256(wordArray).toString(Hex);
      expect(cryptoJsResult).toBe(nodeResult);
    });
  });

  describe("SHA384", () => {
    test.each(testVectors)('should match node:crypto for "%s"', (input) => {
      const nodeResult = nodeCrypto.createHash("sha384").update(input).digest("hex");
      const cryptoJsResult = sha384(input).toString(Hex);
      expect(cryptoJsResult).toBe(nodeResult);
    });
  });

  describe("SHA512", () => {
    test.each(testVectors)('should match node:crypto for "%s"', (input) => {
      const nodeResult = nodeCrypto.createHash("sha512").update(input).digest("hex");
      const cryptoJsResult = sha512(input).toString(Hex);
      expect(cryptoJsResult).toBe(nodeResult);
    });
  });

  describe("HMAC-MD5", () => {
    const keys = [
      "key",
      "secret",
      "a very long key that is longer than the block size of the hash",
    ];

    test.each(testVectors)('should match node:crypto for message "%s"', (message) => {
      for (const key of keys) {
        const nodeResult = nodeCrypto.createHmac("md5", key).update(message).digest("hex");
        const cryptoJsResult = HmacMD5(message, key).toString(Hex);
        expect(cryptoJsResult).toBe(nodeResult);
      }
    });
  });

  describe("HMAC-SHA1", () => {
    const keys = [
      "key",
      "secret",
      "a very long key that is longer than the block size of the hash",
    ];

    test.each(testVectors)('should match node:crypto for message "%s"', (message) => {
      for (const key of keys) {
        const nodeResult = nodeCrypto.createHmac("sha1", key).update(message).digest("hex");
        const cryptoJsResult = HmacSHA1(message, key).toString(Hex);
        expect(cryptoJsResult).toBe(nodeResult);
      }
    });
  });

  describe("HMAC-SHA256", () => {
    const keys = [
      "key",
      "secret",
      "a very long key that is longer than the block size of the hash",
    ];

    test.each(testVectors)('should match node:crypto for message "%s"', (message) => {
      for (const key of keys) {
        const nodeResult = nodeCrypto.createHmac("sha256", key).update(message).digest("hex");
        const cryptoJsResult = HmacSHA256(message, key).toString(Hex);
        expect(cryptoJsResult).toBe(nodeResult);
      }
    });
  });

  describe("HMAC-SHA384", () => {
    const keys = ["key", "secret"];

    test.each(testVectors)('should match node:crypto for message "%s"', (message) => {
      for (const key of keys) {
        const nodeResult = nodeCrypto.createHmac("sha384", key).update(message).digest("hex");
        const cryptoJsResult = HmacSHA384(message, key).toString(Hex);
        expect(cryptoJsResult).toBe(nodeResult);
      }
    });
  });

  describe("HMAC-SHA512", () => {
    const keys = ["key", "secret"];

    test.each(testVectors)('should match node:crypto for message "%s"', (message) => {
      for (const key of keys) {
        const nodeResult = nodeCrypto.createHmac("sha512", key).update(message).digest("hex");
        const cryptoJsResult = HmacSHA512(message, key).toString(Hex);
        expect(cryptoJsResult).toBe(nodeResult);
      }
    });
  });

  describe("PBKDF2", () => {
    const pbkdf2Vectors = [
      { password: "password", salt: "salt", iterations: 1, keyLen: 20 },
      { password: "password", salt: "salt", iterations: 2, keyLen: 20 },
      { password: "password", salt: "salt", iterations: 4096, keyLen: 20 },
      {
        password: "passwordPASSWORDpassword",
        salt: "saltSALTsaltSALTsaltSALTsaltSALTsalt",
        iterations: 4096,
        keyLen: 25,
      },
      { password: "pass\0word", salt: "sa\0lt", iterations: 4096, keyLen: 16 },
    ];

    test.each(pbkdf2Vectors)(
      "should match node:crypto for password=$password, salt=$salt, iterations=$iterations, keyLen=$keyLen",
      ({ password, salt, iterations, keyLen }) => {
        const nodeResult = nodeCrypto
          .pbkdf2Sync(password, salt, iterations, keyLen, "sha1")
          .toString("hex");
        const cryptoJsResult = pbkdf2(password, salt, {
          keySize: keyLen / 4,
          iterations,
          hasher: SHA1,
        }).toString(Hex);
        expect(cryptoJsResult).toBe(nodeResult);
      },
    );
  });

  describe("AES-CBC", () => {
    const aesVectors = [
      {
        key: "00112233445566778899aabbccddeeff",
        iv: "00000000000000000000000000000000",
        plaintext: "Hello, World!",
      },
      {
        key: "2b7e151628aed2a6abf7158809cf4f3c",
        iv: "000102030405060708090a0b0c0d0e0f",
        plaintext: "This is a test message for AES encryption",
      },
    ];

    test.each(aesVectors)(
      "should encrypt/decrypt correctly with key=$key",
      ({ key, iv, plaintext }) => {
        const keyBuffer = Buffer.from(key, "hex");
        const ivBuffer = Buffer.from(iv, "hex");
        const keyWordArray = typedArrayToWordArray(keyBuffer);
        const ivWordArray = typedArrayToWordArray(ivBuffer);

        // Encrypt with node:crypto
        const cipher = nodeCrypto.createCipheriv("aes-128-cbc", keyBuffer, ivBuffer);
        const nodeEncrypted = Buffer.concat([
          cipher.update(plaintext, "utf8"),
          cipher.final(),
        ]).toString("hex");

        // Encrypt with CryptoJS
        const encrypted = AESHelper.encrypt(plaintext, keyWordArray, {
          iv: ivWordArray,
          mode: CBC,
          padding: Pkcs7,
        });
        const cryptoJsEncrypted = encrypted.ciphertext!.toString(Hex);

        expect(cryptoJsEncrypted).toBe(nodeEncrypted);

        // Verify decryption
        const decrypted = AESHelper.decrypt(encrypted, keyWordArray, {
          iv: ivWordArray,
          mode: CBC,
          padding: Pkcs7,
        });
        expect(decrypted.toString(Utf8)).toBe(plaintext);
      },
    );
  });

  describe("Random data hashing", () => {
    test("should produce same hash for random data", () => {
      // Generate random data
      const randomBytes = nodeCrypto.randomBytes(256);

      // Create WordArray from random bytes
      const wordArray = typedArrayToWordArray(randomBytes);

      // Compare MD5
      const nodeMd5 = nodeCrypto.createHash("md5").update(randomBytes).digest("hex");
      const cryptoJsMd5 = md5(wordArray).toString(Hex);
      expect(cryptoJsMd5).toBe(nodeMd5);

      // Compare SHA256
      const nodeSha256 = nodeCrypto.createHash("sha256").update(randomBytes).digest("hex");
      const cryptoJsSha256 = sha256(wordArray).toString(Hex);
      expect(cryptoJsSha256).toBe(nodeSha256);
    });
  });

  describe("Incremental hashing", () => {
    test("MD5 incremental should match node:crypto", () => {
      const chunks = ["Hello, ", "World", "!"];

      const nodeHash = nodeCrypto.createHash("md5");
      for (const chunk of chunks) {
        nodeHash.update(chunk);
      }
      const nodeResult = nodeHash.digest("hex");

      // CryptoJS incremental
      const hasher = new MD5();
      for (const chunk of chunks) {
        hasher.update(chunk);
      }
      const cryptoJsResult = hasher.finalize().toString(Hex);

      expect(cryptoJsResult).toBe(nodeResult);
    });

    test("SHA256 incremental should match node:crypto", () => {
      const chunks = ["The quick ", "brown fox ", "jumps over ", "the lazy dog"];

      const nodeHash = nodeCrypto.createHash("sha256");
      for (const chunk of chunks) {
        nodeHash.update(chunk);
      }
      const nodeResult = nodeHash.digest("hex");

      // CryptoJS incremental
      const hasher = new SHA256();
      for (const chunk of chunks) {
        hasher.update(chunk);
      }
      const cryptoJsResult = hasher.finalize().toString(Hex);

      expect(cryptoJsResult).toBe(nodeResult);
    });

    test("SHA1 incremental should match node:crypto", () => {
      const chunks = ["abc", "def", "ghi"];

      const nodeHash = nodeCrypto.createHash("sha1");
      for (const chunk of chunks) {
        nodeHash.update(chunk);
      }
      const nodeResult = nodeHash.digest("hex");

      // CryptoJS incremental
      const hasher = new SHA1();
      for (const chunk of chunks) {
        hasher.update(chunk);
      }
      const cryptoJsResult = hasher.finalize().toString(Hex);

      expect(cryptoJsResult).toBe(nodeResult);
    });

    test("SHA384 incremental should match node:crypto", () => {
      const chunks = ["test", "data"];

      const nodeHash = nodeCrypto.createHash("sha384");
      for (const chunk of chunks) {
        nodeHash.update(chunk);
      }
      const nodeResult = nodeHash.digest("hex");

      // CryptoJS incremental
      const hasher = new SHA384();
      for (const chunk of chunks) {
        hasher.update(chunk);
      }
      const cryptoJsResult = hasher.finalize().toString(Hex);

      expect(cryptoJsResult).toBe(nodeResult);
    });

    test("SHA512 incremental should match node:crypto", () => {
      const chunks = ["incremental", " ", "hash", " ", "test"];

      const nodeHash = nodeCrypto.createHash("sha512");
      for (const chunk of chunks) {
        nodeHash.update(chunk);
      }
      const nodeResult = nodeHash.digest("hex");

      // CryptoJS incremental
      const hasher = new SHA512();
      for (const chunk of chunks) {
        hasher.update(chunk);
      }
      const cryptoJsResult = hasher.finalize().toString(Hex);

      expect(cryptoJsResult).toBe(nodeResult);
    });
  });
});
