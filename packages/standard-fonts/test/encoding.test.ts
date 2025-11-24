import { describe, expect, it } from "vitest";

import { Encodings } from "../src/index.js";

describe("Encodings", () => {
  it("lists supported code points in ascending order", () => {
    const winAnsi = Encodings.WinAnsi;
    const { supportedCodePoints } = winAnsi;

    expect(supportedCodePoints.length).toBeGreaterThan(0);
    expect(supportedCodePoints).toEqual(
      [...supportedCodePoints].sort((a, b) => a - b),
    );
  });

  it("encodes mapped code points and reports unsupported ones", () => {
    const encoding = Encodings.Symbol;
    const [firstSupported] = encoding.supportedCodePoints;

    expect(firstSupported).toBeDefined();
    if (firstSupported) {
      const result = encoding.encodeUnicodeCodePoint(firstSupported);
      expect(typeof result.code).toBe("number");
      expect(typeof result.name).toBe("string");
      expect(encoding.canEncodeUnicodeCodePoint(firstSupported)).toBe(true);
    }

    const unsupportedCodePoint = 0xffff;
    expect(encoding.canEncodeUnicodeCodePoint(unsupportedCodePoint)).toBe(
      false,
    );
    expect(() => encoding.encodeUnicodeCodePoint(unsupportedCodePoint)).toThrow(
      /Symbol cannot encode/,
    );
  });
});
