import type { Font, Fontkit, Glyph, Subset, TypeFeatures } from "@chr33s/pdf-fontkit";

import { Cache, toHexStringOfMinLength } from "../../utils/index.js";
import PDFHexString from "../objects/pdf-hex-string.js";
import CustomFontEmbedder from "./custom-font-embedder.js";

/**
 * A note of thanks to the developers of https://github.com/foliojs/pdfkit, as
 * this class borrows from:
 *   https://github.com/devongovett/pdfkit/blob/e71edab0dd4657b5a767804ba86c94c58d01fbca/lib/image/jpeg.coffee
 */
class CustomFontSubsetEmbedder extends CustomFontEmbedder {
  static async for(
    fontkit: Fontkit,
    fontData: Uint8Array,
    customFontName?: string,
    fontFeatures?: TypeFeatures,
  ) {
    const font = await fontkit.create(fontData);
    return new CustomFontSubsetEmbedder(font, fontData, customFontName, fontFeatures);
  }

  readonly #subset: Subset;
  readonly #glyphs: Glyph[];
  readonly #glyphIdMap: Map<number, number>;

  private constructor(
    font: Font,
    fontData: Uint8Array,
    customFontName?: string,
    fontFeatures?: TypeFeatures,
  ) {
    super(font, fontData, customFontName, fontFeatures);

    this.#subset = this.font.createSubset();
    this.#glyphs = [];
    this.glyphCache = Cache.populatedBy(() => this.#glyphs);
    this.#glyphIdMap = new Map();
  }

  async encodeText(text: string): Promise<PDFHexString> {
    const { glyphs } = await this.font.layout(text, this.fontFeatures);
    const hexCodes: string[] = Array.from({ length: glyphs.length });

    for (let idx = 0, len = glyphs.length; idx < len; idx++) {
      const glyph = glyphs[idx];
      const subsetGlyphId = this.#subset.includeGlyph(glyph);

      this.#glyphs[subsetGlyphId - 1] = glyph;
      this.#glyphIdMap.set(glyph.id, subsetGlyphId);

      hexCodes[idx] = toHexStringOfMinLength(subsetGlyphId, 4);
    }

    this.glyphCache.invalidate();
    return PDFHexString.of(hexCodes.join(""));
  }

  protected isCFF(): boolean {
    return (this.#subset as any).cff;
  }

  protected glyphId(glyph?: Glyph): number {
    return glyph ? this.#glyphIdMap.get(glyph.id)! : -1;
  }

  protected serializeFont(): Promise<Uint8Array> {
    return Promise.resolve(this.#subset.encodeBuffer());
  }
}

export default CustomFontSubsetEmbedder;
