import { describe, expect, test } from "vitest";
import {
  Hex,
  HMAC,
  HmacMD5,
  HmacSHA1,
  HmacSHA224,
  HmacSHA256,
  HmacSHA384,
  HmacSHA512,
  MD5,
  SHA1,
  SHA224,
  SHA256,
  SHA384,
  SHA512,
  WordArray,
} from "../src/index.js";

describe("HmacMD5", () => {
  describe("HMAC vectors", () => {
    test("should hash with hex key", () => {
      expect(HmacMD5("Hi There", Hex.parse("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b")).toString()).toBe(
        "9294727a3638bb1c13f48ef8158bfc9d",
      );
    });

    test("should hash with string key", () => {
      expect(HmacMD5("what do ya want for nothing?", "Jefe").toString()).toBe(
        "750c783e6ab0b503eaa86e310a5db738",
      );
    });

    test("should hash with repeated input", () => {
      expect(
        HmacMD5(
          Hex.parse(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ),
          Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        ).toString(),
      ).toBe("56be34521d144c88dbb8c733f0e8b3f6");
    });
  });

  describe("update", () => {
    test("should handle progressive updates", () => {
      const hmac = new HMAC(MD5, Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddddddd"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddd"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddd"));

      expect(hmac.finalize().toString()).toBe(
        HmacMD5(
          Hex.parse(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ),
          Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        ).toString(),
      );
    });
  });

  describe("input integrity", () => {
    test("should not modify inputs", () => {
      const message = new WordArray([0x12345678]);
      const key = new WordArray([0x12345678]);

      const expectedMessage = message.toString();
      const expectedKey = key.toString();

      HmacMD5(message, key);

      expect(message.toString()).toBe(expectedMessage);
      expect(key.toString()).toBe(expectedKey);
    });
  });
});

describe("HmacSHA256", () => {
  describe("HMAC vectors", () => {
    test("should hash with hex key", () => {
      expect(
        new HMAC(SHA256, Hex.parse("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b"))
          .finalize("Hi There")
          .toString(),
      ).toBe("492ce020fe2534a5789dc3848806c78f4f6711397f08e7e7a12ca5a4483c8aa6");
    });

    test("should hash with string key", () => {
      expect(HmacSHA256("what do ya want for nothing?", "Jefe").toString()).toBe(
        "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
      );
    });

    test("should hash with repeated input", () => {
      expect(
        HmacSHA256(
          Hex.parse(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ),
          Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        ).toString(),
      ).toBe("7dda3cc169743a6484649f94f0eda0f9f2ff496a9733fb796ed5adb40a44c3c1");
    });

    test("should hash uppercase letters with single char key", () => {
      expect(HmacSHA256("ABCDEFGHIJKLMNOPQRSTUVWXYZ", "A").toString()).toBe(
        "a89dc8178c1184a62df87adaa77bf86e93064863d93c5131140b0ae98b866687",
      );
    });

    test("should hash lowercase letters with single char key", () => {
      expect(HmacSHA256("abcdefghijklmnopqrstuvwxyz", "A").toString()).toBe(
        "d8cb78419c02fe20b90f8b77427dd9f81817a751d74c2e484e0ac5fc4e6ca986",
      );
    });
  });

  describe("update", () => {
    test("should handle progressive updates", () => {
      const hmac = new HMAC(SHA256, Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddddddd"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddd"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddd"));

      expect(hmac.finalize().toString()).toBe(
        HmacSHA256(
          Hex.parse(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ),
          Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        ).toString(),
      );
    });
  });

  describe("input integrity", () => {
    test("should not modify inputs", () => {
      const message = new WordArray([0x12345678]);
      const key = new WordArray([0x12345678]);

      const expectedMessage = message.toString();
      const expectedKey = key.toString();

      HmacSHA256(message, key);

      expect(message.toString()).toBe(expectedMessage);
      expect(key.toString()).toBe(expectedKey);
    });
  });

  describe("key sigBytes", () => {
    test("should respect key sigBytes", () => {
      const key = WordArray.random(8);
      key.sigBytes = 4;

      const keyClamped = key.clone();
      keyClamped.clamp();

      expect(HmacSHA256("Message", keyClamped).toString()).toBe(
        HmacSHA256("Message", key).toString(),
      );
    });
  });
});

describe("HmacSHA1", () => {
  describe("HMAC vectors", () => {
    test("should hash with hex key", () => {
      expect(HmacSHA1("Hi There", Hex.parse("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b")).toString()).toBe(
        "675b0b3a1b4ddf4e124872da6c2f632bfed957e9",
      );
    });

    test("should hash with string key", () => {
      expect(HmacSHA1("what do ya want for nothing?", "Jefe").toString()).toBe(
        "effcdf6ae5eb2fa2d27416d5f184df9c259a7c79",
      );
    });

    test("should hash with repeated input", () => {
      expect(
        HmacSHA1(
          Hex.parse(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ),
          Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        ).toString(),
      ).toBe("d730594d167e35d5956fd8003d0db3d3f46dc7bb");
    });
  });

  describe("update", () => {
    test("should handle progressive updates", () => {
      const hmac = new HMAC(SHA1, Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddddddd"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddd"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddd"));

      expect(hmac.finalize().toString()).toBe(
        HmacSHA1(
          Hex.parse(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ),
          Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        ).toString(),
      );
    });
  });
});

describe("HmacSHA224", () => {
  describe("HMAC vectors", () => {
    test("should hash with hex key", () => {
      expect(HmacSHA224("Hi There", Hex.parse("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b")).toString()).toBe(
        "4e841ce7a4ae83fbcf71e3cd64bfbf277f73a14680aae8c518ac7861",
      );
    });

    test("should hash with string key", () => {
      expect(HmacSHA224("what do ya want for nothing?", "Jefe").toString()).toBe(
        "a30e01098bc6dbbf45690f3a7e9e6d0f8bbea2a39e6148008fd05e44",
      );
    });

    test("should hash with repeated input", () => {
      expect(
        HmacSHA224(
          Hex.parse(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ),
          Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        ).toString(),
      ).toBe("cbff7c2716bbaa7c77bed4f491d3e8456cb6c574e92f672b291acf5b");
    });

    test("should hash uppercase letters with single char key", () => {
      expect(HmacSHA224("ABCDEFGHIJKLMNOPQRSTUVWXYZ", "A").toString()).toBe(
        "61bf669da4fdcd8e5c3bd09ebbb4a986d3d1b298d3ca05c511f7aeff",
      );
    });

    test("should hash lowercase letters with single char key", () => {
      expect(HmacSHA224("abcdefghijklmnopqrstuvwxyz", "A").toString()).toBe(
        "16fc69ada3c3edc1fe9144d6b98d93393833ae442bedf681110a1176",
      );
    });
  });

  describe("update", () => {
    test("should handle progressive updates", () => {
      const hmac = new HMAC(SHA224, Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddddddd"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddd"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddd"));

      expect(hmac.finalize().toString()).toBe(
        HmacSHA224(
          Hex.parse(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ),
          Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        ).toString(),
      );
    });
  });
});

describe("HmacSHA384", () => {
  describe("HMAC vectors", () => {
    test("should hash with hex key", () => {
      expect(HmacSHA384("Hi There", Hex.parse("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b")).toString()).toBe(
        "7afaa633e20d379b02395915fbc385ff8dc27dcd3885e1068ab942eeab52ec1f20ad382a92370d8b2e0ac8b83c4d53bf",
      );
    });

    test("should hash with string key", () => {
      expect(HmacSHA384("what do ya want for nothing?", "Jefe").toString()).toBe(
        "af45d2e376484031617f78d2b58a6b1b9c7ef464f5a01b47e42ec3736322445e8e2240ca5e69e2c78b3239ecfab21649",
      );
    });

    test("should hash with repeated input", () => {
      expect(
        HmacSHA384(
          Hex.parse(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ),
          Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        ).toString(),
      ).toBe(
        "1383e82e28286b91f4cc7afbd13d5b5c6f887c05e7c4542484043a37a5fe45802a9470fb663bd7b6570fe2f503fc92f5",
      );
    });

    test("should hash uppercase letters with single char key", () => {
      expect(HmacSHA384("ABCDEFGHIJKLMNOPQRSTUVWXYZ", "A").toString()).toBe(
        "365dfb271adb8e30fe6c74220b75df1b38c2d19b9d37f2e5a0ec2f3f22bd0406bf5b786e98d81b82c36d3d8a1be6cd07",
      );
    });

    test("should hash lowercase letters with single char key", () => {
      expect(HmacSHA384("abcdefghijklmnopqrstuvwxyz", "A").toString()).toBe(
        "a8357d5e84da64140e41545562ae0782e2a58e39c6cd98939fad8d9080e774c84b7eaca4ba07f6dbf0f12eab912c5285",
      );
    });
  });

  describe("update", () => {
    test("should handle progressive updates", () => {
      const hmac = new HMAC(SHA384, Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddddddd"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddd"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddd"));

      expect(hmac.finalize().toString()).toBe(
        HmacSHA384(
          Hex.parse(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ),
          Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        ).toString(),
      );
    });
  });

  describe("input integrity", () => {
    test("should not modify inputs", () => {
      const message = new WordArray([0x12345678]);
      const key = new WordArray([0x12345678]);

      const expectedMessage = message.toString();
      const expectedKey = key.toString();

      HmacSHA384(message, key);

      expect(message.toString()).toBe(expectedMessage);
      expect(key.toString()).toBe(expectedKey);
    });
  });

  describe("key sigBytes", () => {
    test("should respect key sigBytes", () => {
      const key = WordArray.random(8);
      key.sigBytes = 4;

      const keyClamped = key.clone();
      keyClamped.clamp();

      expect(HmacSHA384("Message", keyClamped).toString()).toBe(
        HmacSHA384("Message", key).toString(),
      );
    });
  });
});

describe("HmacSHA512", () => {
  describe("HMAC vectors", () => {
    test("should hash with hex key", () => {
      expect(HmacSHA512("Hi There", Hex.parse("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b")).toString()).toBe(
        "7641c48a3b4aa8f887c07b3e83f96affb89c978fed8c96fcbbf4ad596eebfe496f9f16da6cd080ba393c6f365ad72b50d15c71bfb1d6b81f66a911786c6ce932",
      );
    });

    test("should hash with string key", () => {
      expect(HmacSHA512("what do ya want for nothing?", "Jefe").toString()).toBe(
        "164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea2505549758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737",
      );
    });

    test("should hash with repeated input", () => {
      expect(
        HmacSHA512(
          Hex.parse(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ),
          Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        ).toString(),
      ).toBe(
        "ad9b5c7de72693737cd5e9d9f41170d18841fec1201c1c1b02e05cae116718009f771cad9946ddbf7e3cde3e818d9ae85d91b2badae94172d096a44a79c91e86",
      );
    });

    test("should hash uppercase letters with single char key", () => {
      expect(HmacSHA512("ABCDEFGHIJKLMNOPQRSTUVWXYZ", "A").toString()).toBe(
        "a303979f7c94bb39a8ab6ce05cdbe28f0255da8bb305263e3478ef7e855f0242729bf1d2be55398f14da8e63f0302465a8a3f76c297bd584ad028d18ed7f0195",
      );
    });

    test("should hash lowercase letters with single char key", () => {
      expect(HmacSHA512("abcdefghijklmnopqrstuvwxyz", "A").toString()).toBe(
        "8c2d56f7628325e62124c0a870ad98d101327fc42696899a06ce0d7121454022fae597e42c25ac3a4c380fd514f553702a5b0afaa9b5a22050902f024368e9d9",
      );
    });
  });

  describe("update", () => {
    test("should handle progressive updates", () => {
      const hmac = new HMAC(SHA512, Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddddddd"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddd"));
      hmac.update(Hex.parse("dddddddddddddddddddddddddddddddd"));

      expect(hmac.finalize().toString()).toBe(
        HmacSHA512(
          Hex.parse(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ),
          Hex.parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        ).toString(),
      );
    });
  });

  describe("input integrity", () => {
    test("should not modify inputs", () => {
      const message = new WordArray([0x12345678]);
      const key = new WordArray([0x12345678]);

      const expectedMessage = message.toString();
      const expectedKey = key.toString();

      HmacSHA512(message, key);

      expect(message.toString()).toBe(expectedMessage);
      expect(key.toString()).toBe(expectedKey);
    });
  });

  describe("key sigBytes", () => {
    test("should respect key sigBytes", () => {
      const key = WordArray.random(8);
      key.sigBytes = 4;

      const keyClamped = key.clone();
      keyClamped.clamp();

      expect(HmacSHA512("Message", keyClamped).toString()).toBe(
        HmacSHA512("Message", key).toString(),
      );
    });
  });
});
