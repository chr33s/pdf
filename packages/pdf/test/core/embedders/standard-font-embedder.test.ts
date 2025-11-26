import { FontNames } from "@chr33s/standard-fonts";
import { describe, expect, test } from "vitest";
import {
  PDFContext,
  PDFDict,
  PDFHexString,
  PDFRef,
  StandardFontEmbedder,
} from "../../../src/index.js";

describe("StandardFontEmbedder", () => {
  test("can be constructed with StandardFontEmbedder.for(...)", () => {
    const embedder = StandardFontEmbedder.for(FontNames.Helvetica);
    expect(embedder).toBeInstanceOf(StandardFontEmbedder);
  });

  test("exposes the font's name", () => {
    const embedder = StandardFontEmbedder.for(FontNames.HelveticaOblique);
    expect(embedder.fontName).toBe("Helvetica-Oblique");
  });

  test("can use a custom font name", () => {
    const customName = "Roboto 2";
    const embedder = StandardFontEmbedder.for(FontNames.HelveticaOblique, customName);
    expect(embedder.customName).toBe(customName);
  });

  test("can embed standard font dictionaries into PDFContexts without a predefined ref", () => {
    const context = PDFContext.create();
    const embedder = StandardFontEmbedder.for(FontNames.Courier);

    expect(context.enumerateIndirectObjects().length).toBe(0);
    const ref = embedder.embedIntoContext(context);
    expect(context.enumerateIndirectObjects().length).toBe(1);
    expect(context.lookup(ref)).toBeInstanceOf(PDFDict);
  });

  test("can embed standard font dictionaries into PDFContexts with a predefined ref", () => {
    const context = PDFContext.create();
    const predefinedRef = PDFRef.of(9999);
    const embedder = StandardFontEmbedder.for(FontNames.Courier);

    expect(context.enumerateIndirectObjects().length).toBe(0);
    const ref = embedder.embedIntoContext(context, predefinedRef);
    expect(context.enumerateIndirectObjects().length).toBe(1);
    expect(context.lookup(predefinedRef)).toBeInstanceOf(PDFDict);
    expect(ref).toBe(predefinedRef);
  });

  test("can encode text strings into PDFHexString objects", () => {
    const text = "Stuff and thingz!";
    const embedder = StandardFontEmbedder.for(FontNames.TimesRoman);
    expect(embedder.encodeText(text)).toBeInstanceOf(PDFHexString);
    expect(String(embedder.encodeText(text))).toBe(
      String(PDFHexString.of("537475666620616E64207468696E677A21")),
    );
  });

  test("can measure the width of text strings at the given font size", () => {
    const text = "Stuff and thingz!";
    const embedder = StandardFontEmbedder.for(FontNames.HelveticaBold);
    expect(embedder.widthOfTextAtSize(text, 12)).toBe(94.656);
    expect(embedder.widthOfTextAtSize(text, 24)).toBe(189.312);
  });

  test("can measure the height of the font at the given size", () => {
    const embedder = StandardFontEmbedder.for(FontNames.HelveticaBold);
    expect(embedder.heightOfFontAtSize(12)).toBeCloseTo(11.1);
    expect(embedder.heightOfFontAtSize(24)).toBeCloseTo(22.2);
  });

  test("can measure the size of the font at a given height", () => {
    const embedder = StandardFontEmbedder.for(FontNames.HelveticaBold);
    expect(embedder.sizeOfFontAtHeight(12)).toBeCloseTo(12.972);
    expect(embedder.sizeOfFontAtHeight(24)).toBeCloseTo(25.945);
  });
});
