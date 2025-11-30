import { describe, expect, test } from "vitest";
import { Hex, HMAC, HmacSHA384, SHA384, sha384, WordArray } from "../src/index.js";

describe("SHA384", () => {
  describe("hash vectors", () => {
    test("should hash empty string", () => {
      expect(sha384("").toString()).toBe(
        "38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b",
      );
    });

    test('should hash "abc"', () => {
      expect(sha384("abc").toString()).toBe(
        "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
      );
    });

    test("should hash two block message", () => {
      expect(
        sha384(
          "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu",
        ).toString(),
      ).toBe(
        "09330c33f71147e83d192fc782cd1b4753111b173b3b05d22fa08086e3b0f712fcc7c71a557e2db966c3e9fa91746039",
      );
    });
  });

  describe("clone", () => {
    test("should clone correctly", () => {
      const hasher = new SHA384();

      expect(hasher.update("a").clone().finalize().toString()).toBe(sha384("a").toString());
      expect(hasher.update("b").clone().finalize().toString()).toBe(sha384("ab").toString());
      expect(hasher.update("c").clone().finalize().toString()).toBe(sha384("abc").toString());
    });
  });

  describe("input integrity", () => {
    test("should not modify input", () => {
      const message = new WordArray([0x12345678]);
      const expected = message.toString();

      sha384(message);

      expect(message.toString()).toBe(expected);
    });
  });

  describe("helper", () => {
    test("should produce same result as class", () => {
      expect(new SHA384().finalize("").toString()).toBe(sha384("").toString());
    });
  });
});

describe("HmacSHA384", () => {
  test("should calculate HMAC correctly", () => {
    expect(
      new HMAC(SHA384, Hex.parse("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b"))
        .finalize("Hi There")
        .toString(),
    ).toBe(HmacSHA384("Hi There", Hex.parse("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b")).toString());
  });
});
