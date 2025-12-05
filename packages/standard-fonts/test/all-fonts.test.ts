import { describe, expect, test } from "vitest";

import { Font, FontNames } from "../src/index.js";

describe("FontNames", () => {
  test("contains all standard 14 PDF fonts", () => {
    expect(FontNames.Courier).toBe("Courier");
    expect(FontNames.CourierBold).toBe("Courier-Bold");
    expect(FontNames.CourierOblique).toBe("Courier-Oblique");
    expect(FontNames.CourierBoldOblique).toBe("Courier-BoldOblique");

    expect(FontNames.Helvetica).toBe("Helvetica");
    expect(FontNames.HelveticaBold).toBe("Helvetica-Bold");
    expect(FontNames.HelveticaOblique).toBe("Helvetica-Oblique");
    expect(FontNames.HelveticaBoldOblique).toBe("Helvetica-BoldOblique");

    expect(FontNames.TimesRoman).toBe("Times-Roman");
    expect(FontNames.TimesRomanBold).toBe("Times-Bold");
    expect(FontNames.TimesRomanItalic).toBe("Times-Italic");
    expect(FontNames.TimesRomanBoldItalic).toBe("Times-BoldItalic");

    expect(FontNames.Symbol).toBe("Symbol");
    expect(FontNames.ZapfDingbats).toBe("ZapfDingbats");
  });
});

describe("Font.load", () => {
  test("loads all Courier variants", async () => {
    const courier = await Font.load(FontNames.Courier);
    const courierBold = await Font.load(FontNames.CourierBold);
    const courierOblique = await Font.load(FontNames.CourierOblique);
    const courierBoldOblique = await Font.load(FontNames.CourierBoldOblique);

    expect(courier.FontName).toBe("Courier");
    expect(courierBold.FontName).toBe("Courier-Bold");
    expect(courierOblique.FontName).toBe("Courier-Oblique");
    expect(courierBoldOblique.FontName).toBe("Courier-BoldOblique");
  });

  test("loads all Helvetica variants", async () => {
    const helvetica = await Font.load(FontNames.Helvetica);
    const helveticaBold = await Font.load(FontNames.HelveticaBold);
    const helveticaOblique = await Font.load(FontNames.HelveticaOblique);
    const helveticaBoldOblique = await Font.load(FontNames.HelveticaBoldOblique);

    expect(helvetica.FontName).toBe("Helvetica");
    expect(helveticaBold.FontName).toBe("Helvetica-Bold");
    expect(helveticaOblique.FontName).toBe("Helvetica-Oblique");
    expect(helveticaBoldOblique.FontName).toBe("Helvetica-BoldOblique");
  });

  test("loads all Times variants", async () => {
    const timesRoman = await Font.load(FontNames.TimesRoman);
    const timesBold = await Font.load(FontNames.TimesRomanBold);
    const timesItalic = await Font.load(FontNames.TimesRomanItalic);
    const timesBoldItalic = await Font.load(FontNames.TimesRomanBoldItalic);

    expect(timesRoman.FontName).toBe("Times-Roman");
    expect(timesBold.FontName).toBe("Times-Bold");
    expect(timesItalic.FontName).toBe("Times-Italic");
    expect(timesBoldItalic.FontName).toBe("Times-BoldItalic");
  });

  test("loads Symbol font", async () => {
    const symbol = await Font.load(FontNames.Symbol);
    expect(symbol.FontName).toBe("Symbol");
    expect(symbol.CharMetrics.length).toBeGreaterThan(0);
  });

  test("loads ZapfDingbats font", async () => {
    const zapf = await Font.load(FontNames.ZapfDingbats);
    expect(zapf.FontName).toBe("ZapfDingbats");
    expect(zapf.CharMetrics.length).toBeGreaterThan(0);
  });

  test("font has expected properties", async () => {
    const font = await Font.load(FontNames.Helvetica);

    expect(font.Comment).toBeDefined();
    expect(font.FontName).toBe("Helvetica");
    expect(font.FullName).toBeDefined();
    expect(font.FamilyName).toBeDefined();
    expect(font.Weight).toBeDefined();
    expect(typeof font.ItalicAngle).toBe("number");
    expect(typeof font.IsFixedPitch).toBe("boolean");
    expect(font.FontBBox).toHaveLength(4);
    expect(font.CharMetrics).toBeInstanceOf(Array);
    expect(font.KernPairs).toBeInstanceOf(Array);
  });

  test("getWidthOfGlyph returns undefined for unknown glyph", async () => {
    const font = await Font.load(FontNames.Helvetica);
    expect(font.getWidthOfGlyph("nonexistent_glyph_name")).toBeUndefined();
  });

  test("getWidthOfGlyph returns width for common glyphs", async () => {
    const font = await Font.load(FontNames.Helvetica);

    const widthA = font.getWidthOfGlyph("A");
    expect(widthA).toBeGreaterThan(0);

    const widthSpace = font.getWidthOfGlyph("space");
    expect(widthSpace).toBeGreaterThan(0);
  });

  test("getXAxisKerningForPair returns undefined for non-kerned pairs", async () => {
    const font = await Font.load(FontNames.Helvetica);
    expect(font.getXAxisKerningForPair("A", "Z")).toBeUndefined();
  });

  test("Courier fonts have fixed pitch", async () => {
    const courier = await Font.load(FontNames.Courier);
    expect(courier.IsFixedPitch).toBe(true);
  });

  test("different fonts have different widths for the same glyph", async () => {
    const courier = await Font.load(FontNames.Courier);
    const helvetica = await Font.load(FontNames.Helvetica);

    // In a monospace font (Courier), all glyphs have the same width
    // In a proportional font (Helvetica), glyphs have different widths
    const courierI = courier.getWidthOfGlyph("i");
    const courierM = courier.getWidthOfGlyph("m");
    const helveticaI = helvetica.getWidthOfGlyph("i");
    const helveticaM = helvetica.getWidthOfGlyph("m");

    // Courier is monospaced, so i and m have the same width
    expect(courierI).toBe(courierM);

    // Helvetica is proportional, so i is narrower than m
    expect(helveticaI).toBeLessThan(helveticaM!);
  });
});
