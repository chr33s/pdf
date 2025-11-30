import { describe, expect, test } from "vitest";
import { Hex, md5, RabbitLegacy, RabbitLegacyHelper, WordArray } from "../src/index.js";

describe("RabbitLegacy", () => {
  describe("test vectors", () => {
    test("should encrypt vector 1", () => {
      expect(
        RabbitLegacyHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("00000000000000000000000000000000"),
        ).ciphertext!.toString(),
      ).toBe("02f74a1c26456bf5ecd6a536f05457b1");
    });

    test("should encrypt vector 2", () => {
      expect(
        RabbitLegacyHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("dc51c3ac3bfc62f12e3d36fe91281329"),
        ).ciphertext!.toString(),
      ).toBe("9c51e28784c37fe9a127f63ec8f32d3d");
    });

    test("should encrypt vector 3", () => {
      expect(
        RabbitLegacyHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("c09b0043e9e9ab0187e0c73383957415"),
        ).ciphertext!.toString(),
      ).toBe("9b60d002fd5ceb32accd41a0cd0db10c");
    });

    test("should encrypt vector 4 with IV", () => {
      expect(
        RabbitLegacyHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("00000000000000000000000000000000"),
          { iv: Hex.parse("0000000000000000") },
        ).ciphertext!.toString(),
      ).toBe("edb70567375dcd7cd89554f85e27a7c6");
    });

    test("should encrypt vector 5 with IV", () => {
      expect(
        RabbitLegacyHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("00000000000000000000000000000000"),
          { iv: Hex.parse("597e26c175f573c3") },
        ).ciphertext!.toString(),
      ).toBe("6d7d012292ccdce0e2120058b94ecd1f");
    });

    test("should encrypt vector 6 with IV", () => {
      expect(
        RabbitLegacyHelper.encrypt(
          Hex.parse("00000000000000000000000000000000"),
          Hex.parse("00000000000000000000000000000000"),
          { iv: Hex.parse("2717f4d21a56eba6") },
        ).ciphertext!.toString(),
      ).toBe("4d1051a123afb670bf8d8505c8d85a44");
    });
  });

  describe("multi-part", () => {
    test("should handle progressive processing", () => {
      const rabbit = RabbitLegacy.createEncryptor(Hex.parse("00000000000000000000000000000000"));
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

      RabbitLegacyHelper.encrypt(message, key, { iv });

      expect(message.toString()).toBe(expectedMessage);
      expect(key.toString()).toBe(expectedKey);
      expect(iv.toString()).toBe(expectedIv);
    });
  });

  describe("helper", () => {
    test("should produce same result as class", () => {
      const key = md5("Jefe");
      expect(RabbitLegacy.createEncryptor(key).finalize("Hi There").toString()).toBe(
        RabbitLegacyHelper.encrypt("Hi There", key).ciphertext!.toString(),
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
        const encrypted1 = RabbitLegacyHelper.encrypt("Hi There", "Jefe").toString();
        const encrypted2 = RabbitLegacyHelper.encrypt("Hi There", "Jefe").toString();
        expect(encrypted1).toBe(encrypted2);
      } finally {
        WordArray.random = originalRandom;
      }
    });
  });
});
