import { beforeEach, describe, expect, test } from "vitest";
import { Base64, CipherParams, Latin1, OpenSSLFormatter, WordArray } from "../src/index.js";

describe("OpenSSLFormatter", () => {
  let ciphertext: WordArray;
  let salt: WordArray;

  beforeEach(() => {
    ciphertext = new WordArray([0x00010203, 0x04050607, 0x08090a0b, 0x0c0d0e0f]);
    salt = new WordArray([0x01234567, 0x89abcdef]);
  });

  describe("stringify", () => {
    test("should stringify salted ciphertext", () => {
      const expected = Latin1.parse("Salted__").concat(salt).concat(ciphertext).toString(Base64);
      const actual = OpenSSLFormatter.stringify(new CipherParams({ ciphertext, salt }));

      expect(actual).toBe(expected);
    });

    test("should stringify unsalted ciphertext", () => {
      const expected = ciphertext.toString(Base64);
      const actual = OpenSSLFormatter.stringify(new CipherParams({ ciphertext }));

      expect(actual).toBe(expected);
    });
  });

  describe("parse", () => {
    test("should parse salted string", () => {
      const openSSLStr = OpenSSLFormatter.stringify(new CipherParams({ ciphertext, salt }));
      const cipherParams = OpenSSLFormatter.parse(openSSLStr);

      expect(cipherParams.ciphertext!.toString()).toBe(ciphertext.toString());
      expect(cipherParams.salt!.toString()).toBe(salt.toString());
    });

    test("should parse unsalted string", () => {
      const openSSLStr = OpenSSLFormatter.stringify(new CipherParams({ ciphertext }));
      const cipherParams = OpenSSLFormatter.parse(openSSLStr);

      expect(cipherParams.ciphertext!.toString()).toBe(ciphertext.toString());
    });
  });
});
