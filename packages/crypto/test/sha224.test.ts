import { describe, expect, test } from "vitest";
import { Hex, HMAC, HmacSHA224, SHA224, sha224, WordArray } from "../src/index.js";

describe("SHA224", () => {
  describe("hash vectors", () => {
    test("should hash empty string", () => {
      expect(sha224("").toString()).toBe(
        "d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f",
      );
    });

    test('should hash "abc"', () => {
      expect(sha224("abc").toString()).toBe(
        "23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7",
      );
    });

    test("should hash two block message", () => {
      expect(sha224("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq").toString()).toBe(
        "75388b16512776cc5dba5da1fd890150b0c6455cb4f58b1952522525",
      );
    });
  });

  describe("clone", () => {
    test("should clone correctly", () => {
      const hasher = new SHA224();

      expect(hasher.update("a").clone().finalize().toString()).toBe(sha224("a").toString());
      expect(hasher.update("b").clone().finalize().toString()).toBe(sha224("ab").toString());
      expect(hasher.update("c").clone().finalize().toString()).toBe(sha224("abc").toString());
    });
  });

  describe("input integrity", () => {
    test("should not modify input", () => {
      const message = new WordArray([0x12345678]);
      const expected = message.toString();

      sha224(message);

      expect(message.toString()).toBe(expected);
    });
  });

  describe("helper", () => {
    test("should produce same result as class", () => {
      expect(new SHA224().finalize("").toString()).toBe(sha224("").toString());
    });
  });
});

describe("HmacSHA224", () => {
  test("should calculate HMAC correctly", () => {
    expect(
      new HMAC(SHA224, Hex.parse("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b"))
        .finalize("Hi There")
        .toString(),
    ).toBe(HmacSHA224("Hi There", Hex.parse("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b")).toString());
  });
});
