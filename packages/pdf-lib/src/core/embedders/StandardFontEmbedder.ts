import {
  Encodings,
  EncodingType,
  Font,
  FontNames,
  type FontName,
} from "@chr33s/standard-fonts";

import { toCodePoint, toHexString } from "../../utils/index.js";
import PDFHexString from "../objects/PDFHexString.js";
import PDFRef from "../objects/PDFRef.js";
import PDFContext from "../PDFContext.js";

export interface Glyph {
  code: number;
  name: string;
}

/**
 * A note of thanks to the developers of https://github.com/foliojs/pdfkit, as
 * this class borrows from:
 *   https://github.com/foliojs/pdfkit/blob/f91bdd61c164a72ea06be1a43dc0a412afc3925f/lib/font/afm.coffee
 */
class StandardFontEmbedder {
  static for = (fontName: FontName, customName?: string) =>
    new StandardFontEmbedder(fontName, customName);

  readonly font: Font;
  readonly encoding: EncodingType;
  readonly fontName: string;
  readonly customName: string | undefined;

  private constructor(fontName: FontName, customName?: string) {
    // prettier-ignore
    this.encoding = (
        fontName === FontNames.ZapfDingbats ? Encodings.ZapfDingbats
      : fontName === FontNames.Symbol       ? Encodings.Symbol
      : Encodings.WinAnsi
    );
    this.font = Font.load(fontName);
    this.fontName = this.font.FontName;
    this.customName = customName;
  }

  /**
   * Encode the JavaScript string into this font. (JavaScript encodes strings in
   * Unicode, but standard fonts use either WinAnsi, ZapfDingbats, or Symbol
   * encodings)
   */
  encodeText(text: string): PDFHexString {
    const glyphs = this.#encodeTextAsGlyphs(text);
    const hexCodes = glyphs.map((glyph) => toHexString(glyph.code));
    return PDFHexString.of(hexCodes.join(""));
  }

  widthOfTextAtSize(text: string, size: number): number {
    const glyphs = this.#encodeTextAsGlyphs(text);
    let totalWidth = 0;

    for (let idx = 0, len = glyphs.length; idx < len; idx++) {
      const left = glyphs[idx].name;
      const right = (glyphs[idx + 1] || {}).name;
      const kernAmount = this.font.getXAxisKerningForPair(left, right) || 0;
      totalWidth += this.#widthOfGlyph(left) + kernAmount;
    }

    const scale = size / 1000;
    return totalWidth * scale;
  }

  heightOfFontAtSize(
    size: number,
    options: { descender?: boolean } = {},
  ): number {
    const { descender = true } = options;

    const { Ascender, Descender, FontBBox } = this.font;
    const yTop = Ascender || FontBBox[3];
    const yBottom = Descender || FontBBox[1];

    let height = yTop - yBottom;
    if (!descender) height += Descender || 0;

    return (height / 1000) * size;
  }

  sizeOfFontAtHeight(height: number): number {
    const { Ascender, Descender, FontBBox } = this.font;
    const yTop = Ascender || FontBBox[3];
    const yBottom = Descender || FontBBox[1];
    return (1000 * height) / (yTop - yBottom);
  }

  embedIntoContext(context: PDFContext, ref?: PDFRef): PDFRef {
    const fontDict = context.obj({
      Type: "Font",
      Subtype: "Type1",
      BaseFont: this.customName || this.fontName,

      Encoding:
        this.encoding === Encodings.WinAnsi ? "WinAnsiEncoding" : undefined,
    });

    if (ref) {
      context.assign(ref, fontDict);
      return ref;
    } else {
      return context.register(fontDict);
    }
  }

  #widthOfGlyph(glyphName: string): number {
    // Default to 250 if font doesn't specify a width
    return this.font.getWidthOfGlyph(glyphName) || 250;
  }

  #encodeTextAsGlyphs(text: string): Glyph[] {
    const fallbackGlyph = this.#fallbackGlyph();

    return Array.from(text).map((char) => {
      const codePoint = toCodePoint(char)!;
      try {
        return this.encoding.encodeUnicodeCodePoint(codePoint);
      } catch {
        // Replace non-WinAnsi characters with a placeholder
        return fallbackGlyph;
      }
    });
  }

  #fallbackGlyph(): Glyph {
    const preferredFallbacks = ["?", " "];

    for (const candidate of preferredFallbacks) {
      const codePoint = toCodePoint(candidate);
      if (!codePoint) continue;
      if (this.encoding.canEncodeUnicodeCodePoint(codePoint)) {
        return this.encoding.encodeUnicodeCodePoint(codePoint);
      }
    }

    const [firstSupported] = this.encoding.supportedCodePoints;
    if (firstSupported === undefined) {
      throw new Error(
        `Encoding ${this.encoding.name} does not expose any glyphs`,
      );
    }

    return this.encoding.encodeUnicodeCodePoint(firstSupported);
  }
}

export default StandardFontEmbedder;
