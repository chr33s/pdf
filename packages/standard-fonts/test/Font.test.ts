import { describe, expect, it } from "vitest";

import { Font, FontNames } from "../src/index.js";

describe("Font.load", () => {
  it("returns memoized instances", () => {
    const firstLoad = Font.load(FontNames.Courier);
    const secondLoad = Font.load(FontNames.Courier);

    expect(firstLoad).toBe(secondLoad);
  });

  it("computes glyph widths and kerning lookups", () => {
    const font = Font.load(FontNames.Helvetica);

    const charMetrics = font.CharMetrics.find((metric) => metric.N === "A");
    expect(charMetrics).toBeDefined();
    expect(font.getWidthOfGlyph("A")).toBe(charMetrics?.WX);

    const kernPair = font.KernPairs.find(
      ([left, right]) => font.getXAxisKerningForPair(left, right) !== undefined,
    );
    expect(kernPair).toBeDefined();
    if (kernPair) {
      expect(font.getXAxisKerningForPair(kernPair[0], kernPair[1])).toBe(
        kernPair[2],
      );
    }
  });

  it("accepts canonical font name aliases", () => {
    const fromAlias = Font.load(FontNames.HelveticaBold);
    const fromLiteral = Font.load("Helvetica-Bold");

    expect(fromAlias).toBe(fromLiteral);
  });
});
