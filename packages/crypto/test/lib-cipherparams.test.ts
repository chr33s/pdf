import { beforeEach, describe, expect, test } from "vitest";
import { AES, CBC, CipherParams, Hex, OpenSSLFormatter, Pkcs7, WordArray } from "../src/index.js";

describe("CipherParams", () => {
  let ciphertext: WordArray;
  let key: WordArray;
  let iv: WordArray;
  let salt: WordArray;
  let cipherParams: CipherParams;

  beforeEach(() => {
    ciphertext = Hex.parse("000102030405060708090a0b0c0d0e0f");
    key = Hex.parse("101112131415161718191a1b1c1d1e1f");
    iv = Hex.parse("202122232425262728292a2b2c2d2e2f");
    salt = Hex.parse("0123456789abcdef");

    cipherParams = new CipherParams({
      ciphertext,
      key,
      iv,
      salt,
      algorithm: AES,
      mode: CBC,
      padding: Pkcs7,
      blockSize: 4,
      formatter: OpenSSLFormatter,
    });
  });

  describe("init", () => {
    test("should store all parameters", () => {
      expect(cipherParams.ciphertext).toBe(ciphertext);
      expect(cipherParams.key).toBe(key);
      expect(cipherParams.iv).toBe(iv);
      expect(cipherParams.salt).toBe(salt);
      expect(cipherParams.algorithm).toBe(AES);
      expect(cipherParams.mode).toBe(CBC);
      expect(cipherParams.padding).toBe(Pkcs7);
      expect(cipherParams.blockSize).toBe(4);
      expect(cipherParams.formatter).toBe(OpenSSLFormatter);
    });
  });

  describe("toString", () => {
    test("should use default formatter", () => {
      expect(cipherParams.toString()).toBe(OpenSSLFormatter.stringify(cipherParams));
    });

    test("should use custom formatter", () => {
      const JsonFormatter = {
        stringify: (cp: CipherParams) =>
          `{ ct: ${cp.ciphertext?.toString() ?? ""}, iv: ${cp.iv?.toString() ?? ""} }`,
        parse: (_str: string) => new CipherParams({}),
      };

      expect(cipherParams.toString(JsonFormatter)).toBe(JsonFormatter.stringify(cipherParams));
    });
  });
});
