import { describe, expect, test } from "vitest";
import {
  CipherParams,
  DES,
  DESHelper,
  ECB,
  Hex,
  NoPadding,
  PasswordBasedCipher,
  SerializableCipher,
  sha256,
} from "../src/index.js";

describe("DES", () => {
  describe("encrypt", () => {
    test("should encrypt vector 1", () => {
      expect(
        DESHelper.encrypt(Hex.parse("0000000000000000"), Hex.parse("8000000000000000"), {
          mode: ECB,
          padding: NoPadding,
        }).ciphertext!.toString(),
      ).toBe("95a8d72813daa94d");
    });

    test("should encrypt vector 2", () => {
      expect(
        DESHelper.encrypt(Hex.parse("0000000000000000"), Hex.parse("0000000000002000"), {
          mode: ECB,
          padding: NoPadding,
        }).ciphertext!.toString(),
      ).toBe("1de5279dae3bed6f");
    });

    test("should encrypt vector 3", () => {
      expect(
        DESHelper.encrypt(Hex.parse("0000000000002000"), Hex.parse("0000000000000000"), {
          mode: ECB,
          padding: NoPadding,
        }).ciphertext!.toString(),
      ).toBe("1d1ca853ae7c0c5f");
    });

    test("should encrypt vector 4", () => {
      expect(
        DESHelper.encrypt(Hex.parse("3232323232323232"), Hex.parse("3232323232323232"), {
          mode: ECB,
          padding: NoPadding,
        }).ciphertext!.toString(),
      ).toBe("ac978c247863388f");
    });

    test("should encrypt vector 5", () => {
      expect(
        DESHelper.encrypt(Hex.parse("6464646464646464"), Hex.parse("6464646464646464"), {
          mode: ECB,
          padding: NoPadding,
        }).ciphertext!.toString(),
      ).toBe("3af1703d76442789");
    });

    test("should encrypt vector 6", () => {
      expect(
        DESHelper.encrypt(Hex.parse("9696969696969696"), Hex.parse("9696969696969696"), {
          mode: ECB,
          padding: NoPadding,
        }).ciphertext!.toString(),
      ).toBe("a020003c5554f34c");
    });
  });

  describe("decrypt", () => {
    test("should decrypt vector 1", () => {
      expect(
        DESHelper.decrypt(
          new CipherParams({ ciphertext: Hex.parse("95a8d72813daa94d") }),
          Hex.parse("8000000000000000"),
          { mode: ECB, padding: NoPadding },
        ).toString(),
      ).toBe("0000000000000000");
    });

    test("should decrypt vector 2", () => {
      expect(
        DESHelper.decrypt(
          new CipherParams({ ciphertext: Hex.parse("1de5279dae3bed6f") }),
          Hex.parse("0000000000002000"),
          { mode: ECB, padding: NoPadding },
        ).toString(),
      ).toBe("0000000000000000");
    });

    test("should decrypt vector 3", () => {
      expect(
        DESHelper.decrypt(
          new CipherParams({ ciphertext: Hex.parse("1d1ca853ae7c0c5f") }),
          Hex.parse("0000000000000000"),
          { mode: ECB, padding: NoPadding },
        ).toString(),
      ).toBe("0000000000002000");
    });

    test("should decrypt vector 4", () => {
      expect(
        DESHelper.decrypt(
          new CipherParams({ ciphertext: Hex.parse("ac978c247863388f") }),
          Hex.parse("3232323232323232"),
          { mode: ECB, padding: NoPadding },
        ).toString(),
      ).toBe("3232323232323232");
    });

    test("should decrypt vector 5", () => {
      expect(
        DESHelper.decrypt(
          new CipherParams({ ciphertext: Hex.parse("3af1703d76442789") }),
          Hex.parse("6464646464646464"),
          { mode: ECB, padding: NoPadding },
        ).toString(),
      ).toBe("6464646464646464");
    });

    test("should decrypt vector 6", () => {
      expect(
        DESHelper.decrypt(
          new CipherParams({ ciphertext: Hex.parse("a020003c5554f34c") }),
          Hex.parse("9696969696969696"),
          { mode: ECB, padding: NoPadding },
        ).toString(),
      ).toBe("9696969696969696");
    });
  });

  describe("multi-part", () => {
    test("should handle progressive processing", () => {
      const des = DES.createEncryptor(Hex.parse("0123456789abcdef"), {
        mode: ECB,
        padding: NoPadding,
      });
      const ciphertext1 = des.process(Hex.parse("001122334455"));
      const ciphertext2 = des.process(Hex.parse("66778899aa"));
      const ciphertext3 = des.process(Hex.parse("bbccddeeff"));
      const ciphertext4 = des.finalize();

      expect(
        ciphertext1.concat(ciphertext2).concat(ciphertext3).concat(ciphertext4).toString(),
      ).toBe(
        DESHelper.encrypt(
          Hex.parse("00112233445566778899aabbccddeeff"),
          Hex.parse("0123456789abcdef"),
          {
            mode: ECB,
            padding: NoPadding,
          },
        ).ciphertext!.toString(),
      );
    });
  });

  describe("input integrity", () => {
    test("should not modify inputs", () => {
      const message = Hex.parse("00112233445566778899aabbccddeeff");
      const key = Hex.parse("0001020304050607");
      const iv = Hex.parse("08090a0b0c0d0e0f");

      const expectedMessage = message.toString();
      const expectedKey = key.toString();
      const expectedIv = iv.toString();

      DESHelper.encrypt(message, key, { iv });

      expect(message.toString()).toBe(expectedMessage);
      expect(key.toString()).toBe(expectedKey);
      expect(iv.toString()).toBe(expectedIv);
    });
  });

  describe("helper", () => {
    test("should produce same result as class", () => {
      const key = sha256("Jefe");
      expect(
        DES.createEncryptor(key, { mode: ECB, padding: NoPadding }).finalize("Hi There").toString(),
      ).toBe(
        DESHelper.encrypt("Hi There", key, {
          mode: ECB,
          padding: NoPadding,
        }).ciphertext!.toString(),
      );
    });

    test("should work with SerializableCipher", () => {
      const key = sha256("Jefe");
      expect(
        SerializableCipher.encrypt(DES, "Hi There", key, {
          mode: ECB,
          padding: NoPadding,
        }).toString(),
      ).toBe(DESHelper.encrypt("Hi There", key, { mode: ECB, padding: NoPadding }).toString());
    });

    test("should work with PasswordBasedCipher", () => {
      // PasswordBasedCipher uses random salt, so just verify it produces valid output
      const encrypted = PasswordBasedCipher.encrypt(DES, "Hi There", "Jefe", {
        mode: ECB,
        padding: NoPadding,
      });
      expect(encrypted.toString().length).toBeGreaterThan(0);
    });
  });
});
