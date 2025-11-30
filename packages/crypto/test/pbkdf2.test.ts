import { describe, expect, test } from "vitest";
import { Hex, PBKDF2, pbkdf2, WordArray } from "../src/index.js";

describe("PBKDF2", () => {
  describe("key derivation vectors", () => {
    test("should derive 128-bit key", () => {
      expect(pbkdf2("password", "ATHENA.MIT.EDUraeburn", { keySize: 128 / 32 }).toString()).toBe(
        "62929ab995a1111c75c37bc562261ea3",
      );
    });

    test("should derive 256-bit key", () => {
      expect(pbkdf2("password", "ATHENA.MIT.EDUraeburn", { keySize: 256 / 32 }).toString()).toBe(
        "62929ab995a1111c75c37bc562261ea3fb3cdc7e725c4ca87c03cec5bb7663e1",
      );
    });

    test("should derive 128-bit key with 2 iterations", () => {
      expect(
        pbkdf2("password", "ATHENA.MIT.EDUraeburn", {
          keySize: 128 / 32,
          iterations: 2,
        }).toString(),
      ).toBe("262fb72ea65b44ab5ceba7f8c8bfa781");
    });

    test("should derive 256-bit key with 2 iterations", () => {
      expect(
        pbkdf2("password", "ATHENA.MIT.EDUraeburn", {
          keySize: 256 / 32,
          iterations: 2,
        }).toString(),
      ).toBe("262fb72ea65b44ab5ceba7f8c8bfa7815ff9939204eb7357a59a75877d745777");
    });

    test("should derive 128-bit key with 1200 iterations", () => {
      expect(
        pbkdf2("password", "ATHENA.MIT.EDUraeburn", {
          keySize: 128 / 32,
          iterations: 1200,
        }).toString(),
      ).toBe("c76a982415f1acc71dc197273c5b6ada");
    });

    test("should derive 256-bit key with 1200 iterations", () => {
      expect(
        pbkdf2("password", "ATHENA.MIT.EDUraeburn", {
          keySize: 256 / 32,
          iterations: 1200,
        }).toString(),
      ).toBe("c76a982415f1acc71dc197273c5b6ada32f62915ed461718aad32843762433fa");
    });

    test("should derive 128-bit key with hex salt and 5 iterations", () => {
      expect(
        pbkdf2("password", Hex.parse("1234567878563412"), {
          keySize: 128 / 32,
          iterations: 5,
        }).toString(),
      ).toBe("74e98b2e9eeddaab3113c1efc6d82b07");
    });

    test("should derive 256-bit key with hex salt and 5 iterations", () => {
      expect(
        pbkdf2("password", Hex.parse("1234567878563412"), {
          keySize: 256 / 32,
          iterations: 5,
        }).toString(),
      ).toBe("74e98b2e9eeddaab3113c1efc6d82b073c4860195b3e0737fa21a4778f376321");
    });

    test("should derive key with passphrase equal to block size", () => {
      expect(
        pbkdf2(
          "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          "pass phrase equals block size",
          {
            keySize: 128 / 32,
            iterations: 1200,
          },
        ).toString(),
      ).toBe("c1dfb29a4d2f2fb67c6f78d074d66367");
    });

    test("should derive key with passphrase exceeding block size", () => {
      expect(
        pbkdf2(
          "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          "pass phrase exceeds block size",
          {
            keySize: 128 / 32,
            iterations: 1200,
          },
        ).toString(),
      ).toBe("22344bc4b6e32675a8090f3ea80be01d");
    });
  });

  describe("input integrity", () => {
    test("should not modify inputs", () => {
      const password = new WordArray([0x12345678]);
      const salt = new WordArray([0x12345678]);

      const expectedPassword = password.toString();
      const expectedSalt = salt.toString();

      pbkdf2(password, salt);

      expect(password.toString()).toBe(expectedPassword);
      expect(salt.toString()).toBe(expectedSalt);
    });
  });

  describe("helper", () => {
    test("should produce same result as class", () => {
      expect(
        new PBKDF2({ keySize: 128 / 32 }).compute("password", "ATHENA.MIT.EDUraeburn").toString(),
      ).toBe(pbkdf2("password", "ATHENA.MIT.EDUraeburn", { keySize: 128 / 32 }).toString());
    });
  });
});
