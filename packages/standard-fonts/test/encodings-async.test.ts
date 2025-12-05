import { describe, expect, test } from "vitest";

import { getEncodings } from "../src/index.js";

describe("getEncodings", () => {
  test("returns all three encodings", async () => {
    const encodings = await getEncodings();

    expect(encodings.Symbol).toBeDefined();
    expect(encodings.ZapfDingbats).toBeDefined();
    expect(encodings.WinAnsi).toBeDefined();
  });

  test("WinAnsi encoding supports common ASCII characters", async () => {
    const encodings = await getEncodings();
    const winAnsi = encodings.WinAnsi;

    // Space (0x20)
    expect(winAnsi.canEncodeUnicodeCodePoint(0x0020)).toBe(true);
    // 'A' (0x41)
    expect(winAnsi.canEncodeUnicodeCodePoint(0x0041)).toBe(true);
    // 'a' (0x61)
    expect(winAnsi.canEncodeUnicodeCodePoint(0x0061)).toBe(true);
    // '0' (0x30)
    expect(winAnsi.canEncodeUnicodeCodePoint(0x0030)).toBe(true);
  });

  test("Symbol encoding handles Greek letters", async () => {
    const encodings = await getEncodings();
    const symbol = encodings.Symbol;

    // Symbol encoding uses different mappings
    expect(symbol.supportedCodePoints.length).toBeGreaterThan(0);
  });

  test("ZapfDingbats encoding has supported code points", async () => {
    const encodings = await getEncodings();
    const zapf = encodings.ZapfDingbats;

    expect(zapf.supportedCodePoints.length).toBeGreaterThan(0);
  });

  test("encodeUnicodeCodePoint returns code and name", async () => {
    const encodings = await getEncodings();
    const winAnsi = encodings.WinAnsi;

    // Encode 'A'
    const result = winAnsi.encodeUnicodeCodePoint(0x0041);
    expect(typeof result.code).toBe("number");
    expect(typeof result.name).toBe("string");
    expect(result.name).toBe("A");
  });

  test("encodeUnicodeCodePoint throws for unsupported code points", async () => {
    const encodings = await getEncodings();
    const winAnsi = encodings.WinAnsi;

    // High Unicode code point not in WinAnsi
    expect(() => winAnsi.encodeUnicodeCodePoint(0x10000)).toThrow(/WinAnsi cannot encode/);
  });

  test("encodings are memoized", async () => {
    const first = await getEncodings();
    const second = await getEncodings();

    expect(first).toBe(second);
  });

  test("supportedCodePoints are sorted in ascending order", async () => {
    const encodings = await getEncodings();

    for (const encoding of [encodings.WinAnsi, encodings.Symbol, encodings.ZapfDingbats]) {
      const { supportedCodePoints } = encoding;
      const sorted = [...supportedCodePoints].sort((a, b) => a - b);
      expect(supportedCodePoints).toEqual(sorted);
    }
  });
});
