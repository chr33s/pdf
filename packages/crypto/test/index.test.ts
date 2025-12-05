import { describe, expect, test } from "vitest";
import { AES, MD5, mode, padding, RC4, SHA256, WordArray } from "../src/index.js";

describe("crypto exports", () => {
  test("should export AES", () => {
    expect(AES).toBeDefined();
  });

  test("should export MD5", () => {
    expect(MD5).toBeDefined();
  });

  test("should export WordArray", () => {
    expect(WordArray).toBeDefined();
  });

  test("should export CBC on mode export", () => {
    expect(mode.CBC).toBeDefined();
  });

  test("should export ECB on mode export", () => {
    expect(mode.ECB).toBeDefined();
  });

  test("should export NoPadding padding export", () => {
    expect(padding.NoPadding).toBeDefined();
  });

  test("should export Pkcs7 padding export", () => {
    expect(padding.Pkcs7).toBeDefined();
  });

  test("should export RC4", () => {
    expect(RC4).toBeDefined();
  });

  test("should export SHA256", () => {
    expect(SHA256).toBeDefined();
  });
});
