import { describe, expect, test } from "vitest";

import { Font, FontNames } from "../src/index.js";

describe("Font.load", () => {
  test("returns memoized instances", async () => {
    const firstLoad = await Font.load(FontNames.Courier);
    const secondLoad = await Font.load(FontNames.Courier);

    expect(firstLoad).toBe(secondLoad);
  });

  test("computes glyph widths and kerning lookups", async () => {
    const font = await Font.load(FontNames.Helvetica);

    const charMetrics = font.CharMetrics.find((metric) => metric.N === "A");
    expect(charMetrics).toBeDefined();
    expect(font.getWidthOfGlyph("A")).toBe(charMetrics?.WX);

    const kernPair = font.KernPairs.find(
      ([left, right]) => font.getXAxisKerningForPair(left, right) !== undefined,
    );
    expect(kernPair).toBeDefined();
    if (kernPair) {
      expect(font.getXAxisKerningForPair(kernPair[0], kernPair[1])).toBe(kernPair[2]);
    }
  });

  test("accepts canonical font name aliases", async () => {
    const fromAlias = await Font.load(FontNames.HelveticaBold);
    const fromLiteral = await Font.load("Helvetica-Bold");

    expect(fromAlias).toBe(fromLiteral);
  });
});
