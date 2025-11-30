import { describe, expect, test } from "vitest";
import { Hex, md5, Rabbit, RabbitHelper, WordArray } from "../src/index.js";

describe("Rabbit", () => {
  describe("test vectors", () => {
    test("should encrypt vector 1", () => {
      expect(
        RabbitHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("00000000000000000000000000000000"),
        ).ciphertext!.toString(),
      ).toBe("02f74a1c26456bf5ecd6a536f05457b1");
    });

    test("should encrypt vector 2", () => {
      expect(
        RabbitHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("c21fcf3881cd5ee8628accb0a9890df8"),
        ).ciphertext!.toString(),
      ).toBe("3d02e0c730559112b473b790dee018df");
    });

    test("should encrypt vector 3", () => {
      expect(
        RabbitHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("1d272c6a2d8e3dfcac14056b78d633a0"),
        ).ciphertext!.toString(),
      ).toBe("a3a97abb80393820b7e50c4abb53823d");
    });

    test("should encrypt vector 4 with IV", () => {
      expect(
        RabbitHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("0053a6f94c9ff24598eb3e91e4378add"),
          { iv: Hex.parse("0d74db42a91077de") },
        ).ciphertext!.toString(),
      ).toBe("75d186d6bc6905c64f1b2dfdd51f7bfc");
    });

    test("should encrypt vector 5 with IV", () => {
      expect(
        RabbitHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("0558abfe51a4f74a9df04396e93c8fe2"),
          { iv: Hex.parse("167de44bb21980e7") },
        ).ciphertext!.toString(),
      ).toBe("476e2750c73856c93563b5f546f56a6a");
    });

    test("should encrypt vector 6 with IV", () => {
      expect(
        RabbitHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("0a5db00356a9fc4fa2f5489bee4194e7"),
          { iv: Hex.parse("1f86ed54bb2289f0") },
        ).ciphertext!.toString(),
      ).toBe("921fcf4983891365a7dc901924b5e24b");
    });

    test("should encrypt vector 7 with IV", () => {
      expect(
        RabbitHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("0f62b5085bae0154a7fa4da0f34699ec"),
          { iv: Hex.parse("288ff65dc42b92f9") },
        ).ciphertext!.toString(),
      ).toBe("613cb0ba96aff6cacf2a459a102a7f78");
    });
  });

  describe("multi-part", () => {
    test("should handle progressive processing", () => {
      const rabbit = Rabbit.createEncryptor(Hex.parse("00000000000000000000000000000000"));
      const ciphertext1 = rabbit.process(Hex.parse("000000000000"));
      const ciphertext2 = rabbit.process(Hex.parse("0000000000"));
      const ciphertext3 = rabbit.process(Hex.parse("0000000000"));
      const ciphertext4 = rabbit.finalize();

      expect(
        ciphertext1.concat(ciphertext2).concat(ciphertext3).concat(ciphertext4).toString(),
      ).toBe("02f74a1c26456bf5ecd6a536f05457b1");
    });
  });

  describe("input integrity", () => {
    test("should not modify inputs", () => {
      const message = Hex.parse("00000000000000000000000000000000");
      const key = Hex.parse("00000000000000000000000000000000");
      const iv = Hex.parse("0000000000000000");

      const expectedMessage = message.toString();
      const expectedKey = key.toString();
      const expectedIv = iv.toString();

      RabbitHelper.encrypt(message, key, { iv });

      expect(message.toString()).toBe(expectedMessage);
      expect(key.toString()).toBe(expectedKey);
      expect(iv.toString()).toBe(expectedIv);
    });
  });

  describe("helper", () => {
    test("should produce same result as class", () => {
      const key = md5("Jefe");
      expect(Rabbit.createEncryptor(key).finalize("Hi There").toString()).toBe(
        RabbitHelper.encrypt("Hi There", key).ciphertext!.toString(),
      );
    });

    test("should work with password encryption", () => {
      // Use predictable random for testing
      const originalRandom = WordArray.random.bind(WordArray);
      WordArray.random = (nBytes: number) => {
        const words: number[] = [];
        for (let i = 0; i < nBytes; i += 4) {
          words.push(0x11223344);
        }
        return new WordArray(words, nBytes);
      };

      try {
        const encrypted1 = RabbitHelper.encrypt("Hi There", "Jefe").toString();
        const encrypted2 = RabbitHelper.encrypt("Hi There", "Jefe").toString();
        expect(encrypted1).toBe(encrypted2);
      } finally {
        WordArray.random = originalRandom;
      }
    });
  });
});
