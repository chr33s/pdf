import { describe, expect, test } from "vitest";
import { AES, MD5, mode, padding, RC4, SHA256, WordArray } from "../src/crypto/index.js";

describe("WordArray", () => {
  test("should create from words", () => {
    const wa = new WordArray([0x48656c6c, 0x6f000000], 5);
    expect(wa.sigBytes).toBe(5);
    expect(wa.words).toEqual([0x48656c6c, 0x6f000000]);
  });

  test("should convert to/from Uint8Array", () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
    const wa = WordArray.fromUint8Array(bytes);
    expect(wa.sigBytes).toBe(5);
    expect(wa.toUint8Array()).toEqual(bytes);
  });

  test("should generate random bytes", () => {
    const wa = WordArray.random(16);
    expect(wa.sigBytes).toBe(16);
    expect(wa.toUint8Array().length).toBe(16);
  });

  test("should concat word arrays", () => {
    const wa1 = WordArray.fromUint8Array(new Uint8Array([0x01, 0x02]));
    const wa2 = WordArray.fromUint8Array(new Uint8Array([0x03, 0x04]));
    wa1.concat(wa2);
    expect(wa1.sigBytes).toBe(4);
    expect(wa1.toUint8Array()).toEqual(new Uint8Array([0x01, 0x02, 0x03, 0x04]));
  });

  test("should clone", () => {
    const wa1 = WordArray.fromUint8Array(new Uint8Array([0x01, 0x02, 0x03]));
    const wa2 = wa1.clone();
    expect(wa2.sigBytes).toBe(wa1.sigBytes);
    expect(wa2.words).toEqual(wa1.words);
    expect(wa2.words).not.toBe(wa1.words);
  });
});

describe("MD5", () => {
  test("should hash empty string", () => {
    const hash = MD5("");
    expect(hash.toString()).toBe("d41d8cd98f00b204e9800998ecf8427e");
  });

  test("should hash 'message'", () => {
    const hash = MD5("message");
    expect(hash.toString()).toBe("78e731027d8fd50ed642340b7c9a63b3");
  });

  test("should hash WordArray", () => {
    const wa = WordArray.fromUint8Array(new TextEncoder().encode("message"));
    const hash = MD5(wa);
    expect(hash.toString()).toBe("78e731027d8fd50ed642340b7c9a63b3");
  });
});

describe("SHA256", () => {
  test("should hash empty string", () => {
    const hash = SHA256("");
    expect(hash.toString()).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  test("should hash 'message'", () => {
    const hash = SHA256("message");
    expect(hash.toString()).toBe(
      "ab530a13e45914982b79f9b7e3fba994cfd1f3fb22f71cea1afbf02b460c6d1d",
    );
  });

  test("should hash WordArray", () => {
    const wa = WordArray.fromUint8Array(new TextEncoder().encode("message"));
    const hash = SHA256(wa);
    expect(hash.toString()).toBe(
      "ab530a13e45914982b79f9b7e3fba994cfd1f3fb22f71cea1afbf02b460c6d1d",
    );
  });
});

describe("RC4", () => {
  test("should encrypt data", () => {
    const key = WordArray.fromUint8Array(new TextEncoder().encode("Secret"));
    const message = WordArray.fromUint8Array(new TextEncoder().encode("Message"));
    const result = RC4.encrypt(message, key);
    expect(result.ciphertext).toBeDefined();
    expect(result.ciphertext.sigBytes).toBeGreaterThan(0);
  });

  test("should decrypt to original", () => {
    const key = WordArray.fromUint8Array(new TextEncoder().encode("Secret"));
    const message = WordArray.fromUint8Array(new TextEncoder().encode("Message"));
    const encrypted = RC4.encrypt(message, key);
    const decrypted = RC4.decrypt(encrypted.ciphertext, key);
    expect(decrypted.ciphertext.toUint8Array()).toEqual(message.toUint8Array());
  });
});

describe("AES", () => {
  test("should encrypt with CBC mode", () => {
    const key = WordArray.fromUint8Array(new Uint8Array(16).fill(0x00));
    const iv = WordArray.fromUint8Array(new Uint8Array(16).fill(0x00));
    const message = WordArray.fromUint8Array(new TextEncoder().encode("Hello World!"));

    const result = AES.encrypt(message, key, { mode: mode.CBC, iv });
    expect(result.ciphertext).toBeDefined();
    expect(result.ciphertext.sigBytes).toBeGreaterThan(0);
  });

  test("should decrypt to original with CBC mode", () => {
    const key = WordArray.fromUint8Array(new Uint8Array(16).fill(0x00));
    const iv = WordArray.fromUint8Array(new Uint8Array(16).fill(0x00));
    const message = WordArray.fromUint8Array(new TextEncoder().encode("Hello World!"));

    const encrypted = AES.encrypt(message, key, { mode: mode.CBC, iv });
    const decrypted = AES.decrypt(encrypted.ciphertext, key, { mode: mode.CBC, iv });

    // Compare the decrypted text
    const decoder = new TextDecoder();
    expect(decoder.decode(decrypted.ciphertext.toUint8Array())).toBe("Hello World!");
  });

  test("should encrypt with ECB mode", () => {
    const key = WordArray.fromUint8Array(new Uint8Array(16).fill(0x00));
    const message = WordArray.fromUint8Array(new Uint8Array(16).fill(0x41)); // 16 bytes of 'A'

    const result = AES.encrypt(message, key, { mode: mode.ECB, padding: padding.NoPadding });
    expect(result.ciphertext).toBeDefined();
  });

  test("should decrypt to original with ECB mode", () => {
    const key = WordArray.fromUint8Array(new Uint8Array(16).fill(0x00));
    const message = WordArray.fromUint8Array(new Uint8Array(16).fill(0x41)); // 16 bytes of 'A'

    const encrypted = AES.encrypt(message, key, { mode: mode.ECB, padding: padding.NoPadding });
    const decrypted = AES.decrypt(encrypted.ciphertext, key, {
      mode: mode.ECB,
      padding: padding.NoPadding,
    });

    expect(decrypted.ciphertext.toUint8Array()).toEqual(message.toUint8Array());
  });

  test("should work with 256-bit key", () => {
    const key = WordArray.fromUint8Array(new Uint8Array(32).fill(0x00));
    const iv = WordArray.fromUint8Array(new Uint8Array(16).fill(0x00));
    const message = WordArray.fromUint8Array(new TextEncoder().encode("Test message"));

    const encrypted = AES.encrypt(message, key, { mode: mode.CBC, iv });
    const decrypted = AES.decrypt(encrypted.ciphertext, key, { mode: mode.CBC, iv });

    const decoder = new TextDecoder();
    expect(decoder.decode(decrypted.ciphertext.toUint8Array())).toBe("Test message");
  });
});
