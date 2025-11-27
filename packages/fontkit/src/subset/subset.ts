import * as r from "@chr33s/restructure";
import type Glyph from "../glyph/glyph.js";
import type { FontLike } from "../glyph/glyph.js";

type GlyphInput = number | Pick<Glyph, "id">;

export default abstract class Subset<TFont extends FontLike = FontLike> {
  protected font: TFont;
  protected glyphs: number[];
  protected mapping: Record<number, number>;
  protected tables: string[];

  constructor(font: TFont) {
    this.font = font;
    this.glyphs = [];
    this.mapping = {};
    this.tables = [];

    // always include the missing glyph
    this.includeGlyph(0);
  }

  includeGlyph(target: GlyphInput): number {
    let glyphId = typeof target === "number" ? target : target.id;

    if (this.mapping[glyphId] == null) {
      this.glyphs.push(glyphId);
      this.mapping[glyphId] = this.glyphs.length - 1;
    }

    return this.mapping[glyphId];
  }

  includeTable(table: unknown) {
    if (typeof table === "string" && table.length === 4) {
      this.tables.push(table);
    }
  }

  /**
   * Encode the subset to a Uint8Array buffer.
   */
  encodeBuffer(): Uint8Array {
    // Use a large initial buffer - fonts can be several MB
    // 64KB per glyph is a generous estimate for most fonts
    const estimatedSize = Math.max(this.glyphs.length * 64 * 1024, 1024 * 1024);
    const stream = new r.EncodeStream(new Uint8Array(estimatedSize));
    this.encode(stream);
    return stream.buffer.subarray(0, stream.pos);
  }

  protected abstract encode(stream: r.EncodeStream): void;
}
