import { decompressJson } from "./utils.js";

import CourierBoldCompressed from "./Courier-Bold.compressed.json" with { type: "json" };
import CourierBoldObliqueCompressed from "./Courier-BoldOblique.compressed.json" with { type: "json" };
import CourierObliqueCompressed from "./Courier-Oblique.compressed.json" with { type: "json" };
import CourierCompressed from "./Courier.compressed.json" with { type: "json" };

import HelveticaBoldCompressed from "./Helvetica-Bold.compressed.json" with { type: "json" };
import HelveticaBoldObliqueCompressed from "./Helvetica-BoldOblique.compressed.json" with { type: "json" };
import HelveticaObliqueCompressed from "./Helvetica-Oblique.compressed.json" with { type: "json" };
import HelveticaCompressed from "./Helvetica.compressed.json" with { type: "json" };

import TimesBoldCompressed from "./Times-Bold.compressed.json" with { type: "json" };
import TimesBoldItalicCompressed from "./Times-BoldItalic.compressed.json" with { type: "json" };
import TimesItalicCompressed from "./Times-Italic.compressed.json" with { type: "json" };
import TimesRomanCompressed from "./Times-Roman.compressed.json" with { type: "json" };

import SymbolCompressed from "./Symbol.compressed.json" with { type: "json" };
import ZapfDingbatsCompressed from "./ZapfDingbats.compressed.json" with { type: "json" };

// prettier-ignore
const compressedJsonForFontName = {
  'Courier': CourierCompressed,
  'Courier-Bold': CourierBoldCompressed,
  'Courier-Oblique': CourierObliqueCompressed,
  'Courier-BoldOblique': CourierBoldObliqueCompressed,

  'Helvetica': HelveticaCompressed,
  'Helvetica-Bold': HelveticaBoldCompressed,
  'Helvetica-Oblique': HelveticaObliqueCompressed,
  'Helvetica-BoldOblique': HelveticaBoldObliqueCompressed,

  'Times-Roman': TimesRomanCompressed,
  'Times-Bold': TimesBoldCompressed,
  'Times-Italic': TimesItalicCompressed,
  'Times-BoldItalic': TimesBoldItalicCompressed,

  'Symbol': SymbolCompressed,
  'ZapfDingbats': ZapfDingbatsCompressed,
};

const fontNames = {
  Courier: "Courier",
  CourierBold: "Courier-Bold",
  CourierOblique: "Courier-Oblique",
  CourierBoldOblique: "Courier-BoldOblique",

  Helvetica: "Helvetica",
  HelveticaBold: "Helvetica-Bold",
  HelveticaOblique: "Helvetica-Oblique",
  HelveticaBoldOblique: "Helvetica-BoldOblique",

  TimesRoman: "Times-Roman",
  TimesRomanBold: "Times-Bold",
  TimesRomanItalic: "Times-Italic",
  TimesRomanBoldItalic: "Times-BoldItalic",

  Symbol: "Symbol",
  ZapfDingbats: "ZapfDingbats",
} as const;

export const FontNames = fontNames;

export type FontName = (typeof fontNames)[keyof typeof fontNames];

export type IFontNames = FontName | keyof typeof compressedJsonForFontName;

const fontCache: Partial<Record<FontName, Font>> = {};

export interface ICharMetrics {
  /** Decimal value of default character code (-1 if not encoded) */
  // C: number;
  /** Width of character */
  WX: number;
  /** Character name (aka Glyph name) */
  N: string;
  /**
   * [llx lly urx ury]:
   *   Character bounding box where llx, lly, urx, and ury are all numbers.
   */
  // B: [number, number, number, number];
  /**
   * Array<[successor ligature]>:
   *   Ligature sequence where successor and ligature are both character names.
   *   The current character may join with the character named successor to form
   *   the character named ligature.
   */
  // L: Array<[string, string]>;
}

/**
 * [name_1 name_2 number_x]:
 *   Name of the first character in the kerning pair followed by the name of the
 *   second character followed by the kerning amount in the x direction
 *   (y is zero). The kerning amount is specified in the units of the character
 *   coordinate system.
 */
export type IKernPair = [string, string, number];

export class Font {
  static load = (fontName: IFontNames): Font => {
    const cachedFont = fontCache[fontName];
    if (cachedFont) return cachedFont;

    const json = decompressJson(compressedJsonForFontName[fontName]);
    const font = Object.assign(new Font(), JSON.parse(json)) as Font;

    const charWidths: Record<string, number> = {};
    for (const metric of font.CharMetrics) {
      charWidths[metric.N] = metric.WX;
    }
    font.#CharWidths = charWidths;

    const kernPairXAmounts: Record<string, Record<string, number>> = {};
    for (const [name1, name2, width] of font.KernPairs) {
      if (!kernPairXAmounts[name1]) kernPairXAmounts[name1] = {};
      kernPairXAmounts[name1][name2] = width;
    }
    font.#KernPairXAmounts = kernPairXAmounts;

    fontCache[fontName] = font;

    return font;
  };

  Comment!: string;
  FontName!: string;
  FullName!: string;
  FamilyName!: string;
  Weight!: string;
  CharacterSet!: string;
  Version!: string;
  Notice!: string;
  EncodingScheme!: string;
  ItalicAngle!: number;
  UnderlinePosition!: number;
  UnderlineThickness!: number;
  CapHeight!: number | void;
  XHeight!: number | void;
  Ascender!: number | void;
  Descender!: number | void;
  StdHW!: number;
  StdVW!: number;
  IsFixedPitch!: boolean;

  /**
   * [llx lly urx ury]:
   *   Font bounding box where llx, lly, urx, and ury are all numbers.
   */
  FontBBox!: [number, number, number, number];

  CharMetrics!: ICharMetrics[];
  KernPairs!: IKernPair[];

  #CharWidths!: { [charName: string]: number };
  #KernPairXAmounts!: { [name1: string]: { [name2: string]: number } };

  private constructor() {}

  getWidthOfGlyph = (glyphName: string): number | void =>
    this.#CharWidths[glyphName];

  getXAxisKerningForPair = (
    leftGlyphName: string,
    rightGlyphName: string,
  ): number | void =>
    (this.#KernPairXAmounts[leftGlyphName] || {})[rightGlyphName];
}
