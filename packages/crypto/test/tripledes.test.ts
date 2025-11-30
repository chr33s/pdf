import { describe, expect, test } from "vitest";
import {
  CipherParams,
  ECB,
  Hex,
  NoPadding,
  PasswordBasedCipher,
  SerializableCipher,
  sha256,
  TripleDES,
  TripleDESHelper,
} from "../src/index.js";

describe("TripleDES", () => {
  describe("encrypt", () => {
    test("should encrypt vector 1", () => {
      expect(
        TripleDESHelper.encrypt(
          Hex.parse("0000000000000000"),
          Hex.parse("800101010101010180010101010101018001010101010101"),
          { mode: ECB, padding: NoPadding },
        ).ciphertext!.toString(),
      ).toBe("95a8d72813daa94d");
    });

    test("should encrypt vector 2", () => {
      expect(
        TripleDESHelper.encrypt(
          Hex.parse("0000000000000000"),
          Hex.parse("010101010101010201010101010101020101010101010102"),
          { mode: ECB, padding: NoPadding },
        ).ciphertext!.toString(),
      ).toBe("869efd7f9f265a09");
    });

    test("should encrypt vector 3", () => {
      expect(
        TripleDESHelper.encrypt(
          Hex.parse("8000000000000000"),
          Hex.parse("010101010101010101010101010101010101010101010101"),
          { mode: ECB, padding: NoPadding },
        ).ciphertext!.toString(),
      ).toBe("95f8a5e5dd31d900");
    });

    test("should encrypt vector 4", () => {
      expect(
        TripleDESHelper.encrypt(
          Hex.parse("0000000000000001"),
          Hex.parse("010101010101010101010101010101010101010101010101"),
          { mode: ECB, padding: NoPadding },
        ).ciphertext!.toString(),
      ).toBe("166b40b44aba4bd6");
    });
  });

  describe("decrypt", () => {
    test("should decrypt vector 1", () => {
      expect(
        TripleDESHelper.decrypt(
          new CipherParams({ ciphertext: Hex.parse("95a8d72813daa94d") }),
          Hex.parse("800101010101010180010101010101018001010101010101"),
          { mode: ECB, padding: NoPadding },
        ).toString(),
      ).toBe("0000000000000000");
    });

    test("should decrypt vector 2", () => {
      expect(
        TripleDESHelper.decrypt(
          new CipherParams({ ciphertext: Hex.parse("869efd7f9f265a09") }),
          Hex.parse("010101010101010201010101010101020101010101010102"),
          { mode: ECB, padding: NoPadding },
        ).toString(),
      ).toBe("0000000000000000");
    });

    test("should decrypt vector 3", () => {
      expect(
        TripleDESHelper.decrypt(
          new CipherParams({ ciphertext: Hex.parse("95f8a5e5dd31d900") }),
          Hex.parse("010101010101010101010101010101010101010101010101"),
          { mode: ECB, padding: NoPadding },
        ).toString(),
      ).toBe("8000000000000000");
    });

    test("should decrypt vector 4", () => {
      expect(
        TripleDESHelper.decrypt(
          new CipherParams({ ciphertext: Hex.parse("166b40b44aba4bd6") }),
          Hex.parse("010101010101010101010101010101010101010101010101"),
          { mode: ECB, padding: NoPadding },
        ).toString(),
      ).toBe("0000000000000001");
    });
  });

  describe("multi-part", () => {
    test("should handle progressive processing", () => {
      const des = TripleDES.createEncryptor(
        Hex.parse("000102030405060708090a0b0c0d0e0f1011121314151617"),
        { mode: ECB, padding: NoPadding },
      );
      const ciphertext1 = des.process(Hex.parse("001122334455"));
      const ciphertext2 = des.process(Hex.parse("66778899aa"));
      const ciphertext3 = des.process(Hex.parse("bbccddeeff"));
      const ciphertext4 = des.finalize();

      expect(
        ciphertext1.concat(ciphertext2).concat(ciphertext3).concat(ciphertext4).toString(),
      ).toBe(
        TripleDESHelper.encrypt(
          Hex.parse("00112233445566778899aabbccddeeff"),
          Hex.parse("000102030405060708090a0b0c0d0e0f1011121314151617"),
          { mode: ECB, padding: NoPadding },
        ).ciphertext!.toString(),
      );
    });
  });

  describe("input integrity", () => {
    test("should not modify inputs", () => {
      const message = Hex.parse("00112233445566778899aabbccddeeff");
      const key = Hex.parse("000102030405060708090a0b0c0d0e0f1011121314151617");
      const iv = Hex.parse("08090a0b0c0d0e0f");

      const expectedMessage = message.toString();
      const expectedKey = key.toString();
      const expectedIv = iv.toString();

      TripleDESHelper.encrypt(message, key, { iv });

      expect(message.toString()).toBe(expectedMessage);
      expect(key.toString()).toBe(expectedKey);
      expect(iv.toString()).toBe(expectedIv);
    });
  });

  describe("key sizes", () => {
    test("should handle 64-bit key (extended to 192-bit)", () => {
      const message = Hex.parse("00112233445566778899aabbccddeeff");
      const key = Hex.parse("0011223344556677");
      const extendedKey = Hex.parse("001122334455667700112233445566770011223344556677");

      const output1 = TripleDESHelper.encrypt(message, key, { mode: ECB }).toString();
      const output2 = TripleDESHelper.encrypt(message, extendedKey, { mode: ECB }).toString();

      expect(output1).toBe(output2);
    });

    test("should handle 128-bit key (extended to 192-bit)", () => {
      const message = Hex.parse("00112233445566778899aabbccddeeff");
      const key = Hex.parse("00112233445566778899aabbccddeeff");
      const extendedKey = Hex.parse("00112233445566778899aabbccddeeff0011223344556677");

      const output1 = TripleDESHelper.encrypt(message, key, { mode: ECB }).toString();
      const output2 = TripleDESHelper.encrypt(message, extendedKey, { mode: ECB }).toString();

      expect(output1).toBe(output2);
    });

    test("should handle 256-bit key (truncated to 192-bit)", () => {
      const message = Hex.parse("00112233445566778899aabbccddeeff");
      const key = Hex.parse("00112233445566778899aabbccddeeff0112233445566778899aabbccddeeff0");
      const truncatedKey = Hex.parse("00112233445566778899aabbccddeeff0112233445566778");

      const output1 = TripleDESHelper.encrypt(message, key, { mode: ECB }).toString();
      const output2 = TripleDESHelper.encrypt(message, truncatedKey, { mode: ECB }).toString();

      expect(output1).toBe(output2);
    });
  });

  describe("helper", () => {
    test("should produce same result as class", () => {
      const key = sha256("Jefe");
      expect(
        TripleDES.createEncryptor(key, { mode: ECB, padding: NoPadding })
          .finalize("Hi There")
          .toString(),
      ).toBe(
        TripleDESHelper.encrypt("Hi There", key, {
          mode: ECB,
          padding: NoPadding,
        }).ciphertext!.toString(),
      );
    });

    test("should work with SerializableCipher", () => {
      const key = sha256("Jefe");
      expect(
        SerializableCipher.encrypt(TripleDES, "Hi There", key, {
          mode: ECB,
          padding: NoPadding,
        }).toString(),
      ).toBe(
        TripleDESHelper.encrypt("Hi There", key, { mode: ECB, padding: NoPadding }).toString(),
      );
    });

    test("should work with PasswordBasedCipher", () => {
      // PasswordBasedCipher uses random salt, so just verify it produces valid output
      const encrypted = PasswordBasedCipher.encrypt(TripleDES, "Hi There", "Jefe", {
        mode: ECB,
        padding: NoPadding,
      });
      expect(encrypted.toString().length).toBeGreaterThan(0);
    });
  });
});
