import * as r from "@chr33s/restructure";
import type Glyph from "../glyph/glyph.js";
import type { FontLike } from "../glyph/glyph.js";

type GlyphInput = number | Pick<Glyph, "id">;

export default abstract class Subset<TFont extends FontLike = FontLike> {
  protected font: TFont;
  protected glyphs: number[];
  protected mapping: Record<number, number>;

  constructor(font: TFont) {
    this.font = font;
    this.glyphs = [];
    this.mapping = {};

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

  encodeStream(): r.EncodeStream {
    let stream = new r.EncodeStream();

    process.nextTick(() => {
      this.encode(stream);
      stream.end();
    });

    return stream;
  }

  protected abstract encode(stream: r.EncodeStream): void;
}
