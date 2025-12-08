import {
  CustomFontEmbedder,
  PDFArray,
  PDFHexString,
  PDFNumber,
  PDFRef,
  StandardFontEmbedder,
} from "../core/index.js";
import {
  assertIs,
  assertOrUndefined,
  toHexString,
  toHexStringOfMinLength,
} from "../utils/index.js";
import Embeddable from "./embeddable.js";
import PDFDocument from "./pdf-document.js";

export type EncodedText = PDFHexString | PDFArray;

type FontEmbedder = CustomFontEmbedder | StandardFontEmbedder;

/**
 * Represents a font that has been embedded in a [[PDFDocument]].
 */
export default class PDFFont implements Embeddable {
  /**
   * > **NOTE:** You probably don't want to call this method directly. Instead,
   * > consider using the [[PDFDocument.embedFont]] and
   * > [[PDFDocument.embedStandardFont]] methods, which will create instances
   * > of [[PDFFont]] for you.
   *
   * Create an instance of [[PDFFont]] from an existing ref and embedder
   *
   * @param ref The unique reference for this font.
   * @param doc The document to which the font will belong.
   * @param embedder The embedder that will be used to embed the font.
   */
  static of = (ref: PDFRef, doc: PDFDocument, embedder: FontEmbedder) =>
    new PDFFont(ref, doc, embedder);

  /** The unique reference assigned to this font within the document. */
  readonly ref: PDFRef;

  /** The document to which this font belongs. */
  readonly doc: PDFDocument;

  /** The name of this font. */
  readonly name: string;

  #modified = true;
  readonly #embedder: FontEmbedder;

  private constructor(ref: PDFRef, doc: PDFDocument, embedder: FontEmbedder) {
    assertIs(ref, "ref", [[PDFRef, "PDFRef"]]);
    assertIs(doc, "doc", [[PDFDocument, "PDFDocument"]]);
    assertIs(embedder, "embedder", [
      [CustomFontEmbedder, "CustomFontEmbedder"],
      [StandardFontEmbedder, "StandardFontEmbedder"],
    ]);

    this.ref = ref;
    this.doc = doc;
    this.name = embedder.fontName;

    this.#embedder = embedder;
  }

  /**
   * > **NOTE:** You probably don't need to call this method directly. The
   * > [[PDFPage.drawText]] method will automatically encode the text it is
   * > given.
   *
   * Encodes a string of text in this font.
   *
   * @param text The text to be encoded.
   * @returns The encoded text as a hex string.
   */
  async encodeText(text: string): Promise<PDFHexString> {
    assertIs(text, "text", ["string"]);
    this.#modified = true;
    return this.#embedder.encodeText(text);
  }

  /**
   * Encode a string of text, returning either a simple hex string (when no
   * kerning adjustments are needed) or a `PDFArray` suitable for the `TJ`
   * operator when kerning adjustments are required.
   */
  async encodeTextWithPositioning(text: string): Promise<EncodedText> {
    assertIs(text, "text", ["string"]);
    this.#modified = true;

    if (this.#embedder instanceof StandardFontEmbedder) {
      return this.#encodeStandardTextWithPositioning(text);
    }

    return this.#encodeCustomTextWithPositioning(text);
  }

  /**
   * Measure the width of a string of text drawn in this font at a given size.
   * For example:
   * ```js
   * const width = font.widthOfTextAtSize('Foo Bar Qux Baz', 36)
   * ```
   * @param text The string of text to be measured.
   * @param size The font size to be used for this measurement.
   * @returns The width of the string of text when drawn in this font at the
   *          given size.
   */
  async widthOfTextAtSize(text: string, size: number): Promise<number> {
    assertIs(text, "text", ["string"]);
    assertIs(size, "size", ["number"]);
    return this.#embedder.widthOfTextAtSize(text, size);
  }

  /**
   * Measure the height of this font at a given size. For example:
   * ```js
   * const height = font.heightAtSize(24)
   * ```
   *
   * The `options.descender` value controls whether or not the font's
   * descender is included in the height calculation.
   *
   * @param size The font size to be used for this measurement.
   * @param options The options to be used when computing this measurement.
   * @returns The height of this font at the given size.
   */
  heightAtSize(size: number, options?: { descender?: boolean }): number {
    assertIs(size, "size", ["number"]);
    assertOrUndefined(options?.descender, "options.descender", ["boolean"]);
    return this.#embedder.heightOfFontAtSize(size, {
      descender: options?.descender ?? true,
    });
  }

  /**
   * Compute the font size at which this font is a given height. For example:
   * ```js
   * const fontSize = font.sizeAtHeight(12)
   * ```
   * @param height The height to be used for this calculation.
   * @returns The font size at which this font is the given height.
   */
  sizeAtHeight(height: number): number {
    assertIs(height, "height", ["number"]);
    return this.#embedder.sizeOfFontAtHeight(height);
  }

  /**
   * Get the set of unicode code points that can be represented by this font.
   * @returns The set of unicode code points supported by this font.
   */
  getCharacterSet(): number[] {
    if (this.#embedder instanceof StandardFontEmbedder) {
      return this.#embedder.encoding.supportedCodePoints;
    } else {
      return this.#embedder.font.characterSet;
    }
  }

  /**
   * > **NOTE:** You probably don't need to call this method directly. The
   * > [[PDFDocument.save]] and [[PDFDocument.saveAsBase64]] methods will
   * > automatically ensure all fonts get embedded.
   *
   * Embed this font in its document.
   *
   * @returns Resolves when the embedding is complete.
   */
  async embed(): Promise<void> {
    // TODO: Cleanup orphan embedded objects if a font is embedded multiple times...
    if (this.#modified) {
      await this.#embedder.embedIntoContext(this.doc.context, this.ref);
      this.#modified = false;
    }
  }

  async #encodeCustomTextWithPositioning(text: string): Promise<EncodedText> {
    const embedder = this.#embedder as CustomFontEmbedder;
    const run = await embedder.font.layout(text, embedder.fontFeatures);

    const glyphs = run.glyphs;
    const positions = run.positions ?? [];
    const glyphIds = embedder.encodeGlyphs(glyphs);
    const hexCodes = glyphIds.map((id) => toHexStringOfMinLength(id, 4));

    const scale = embedder.scale;
    const advances = glyphs.map((glyph, idx) => {
      const position = positions[idx];
      const xAdvance = position?.xAdvance ?? glyph.advanceWidth;
      return xAdvance * scale;
    });
    const widths = glyphs.map((glyph) => glyph.advanceWidth * scale);

    return this.#encodeWithKerningAdjustments(hexCodes, widths, advances);
  }

  #encodeStandardTextWithPositioning(text: string): EncodedText {
    const embedder = this.#embedder as StandardFontEmbedder;
    const glyphs = embedder.glyphsForString(text);
    const hexCodes = glyphs.map((glyph) => toHexString(glyph.code));

    const widths = glyphs.map((glyph) => embedder.widthOfGlyph(glyph.name));
    const advances = glyphs.map((glyph, idx) => {
      const next = glyphs[idx + 1];
      const kernAmount = next
        ? embedder.font.getXAxisKerningForPair(glyph.name, next.name) || 0
        : 0;
      return widths[idx] + kernAmount;
    });

    return this.#encodeWithKerningAdjustments(hexCodes, widths, advances);
  }

  #encodeWithKerningAdjustments(
    hexCodes: string[],
    defaultAdvances: number[],
    advances: number[],
  ): EncodedText {
    if (hexCodes.length === 0) return PDFHexString.of("");

    const adjustments: number[] = Array.from({ length: Math.max(0, hexCodes.length - 1) });
    let hasAdjustment = false;

    for (let idx = 0, len = adjustments.length; idx < len; idx++) {
      const adjustment = defaultAdvances[idx] - advances[idx];
      adjustments[idx] = adjustment;
      if (Math.abs(adjustment) > 1e-6) hasAdjustment = true;
    }

    if (!hasAdjustment) {
      return PDFHexString.of(hexCodes.join(""));
    }

    const array = PDFArray.withContext(this.doc.context);
    let buffer = "";

    for (let idx = 0, len = hexCodes.length; idx < len; idx++) {
      buffer += hexCodes[idx];

      if (idx < adjustments.length && Math.abs(adjustments[idx]) > 1e-6) {
        if (buffer.length > 0) {
          array.push(PDFHexString.of(buffer));
          buffer = "";
        }
        array.push(PDFNumber.of(adjustments[idx]));
      }
    }

    if (buffer.length > 0) {
      array.push(PDFHexString.of(buffer));
    }

    return array;
  }
}
