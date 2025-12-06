import * as r from "@chr33s/pdf-restructure";
import type { CanvasContextLike, GlyphImage } from "./glyph.js";
import TTFGlyph from "./ttf-glyph.js";

let SBIXImage = new r.Struct({
  originX: r.uint16,
  originY: r.uint16,
  type: new r.String(4),
  data: new r.Buffer((t) => t.parent.buflen - t._currentOffset),
});

/**
 * Represents a color (e.g. emoji) glyph in Apple's SBIX format.
 */
export default class SBIXGlyph extends TTFGlyph {
  /**
   * Returns an object representing a glyph image at the given point size.
   * The object has a data property with a Uint8Array containing the actual image data,
   * along with the image type, and origin.
   *
   * @param {number} size
   * @return {object}
   */
  getImageForSize(size: number): GlyphImage | null {
    let table: any = null;
    for (let i = 0; i < this._font.sbix.imageTables.length; i++) {
      table = this._font.sbix.imageTables[i];
      if (table.ppem >= size) {
        break;
      }
    }

    let offsets = table.imageOffsets;
    let start = offsets[this.id];
    let end = offsets[this.id + 1];

    if (start === end) {
      return null;
    }

    this._font.stream.pos = start;
    return SBIXImage.decode(this._font.stream, {
      buflen: end - start,
    }) as GlyphImage;
  }

  async render(
    ctx: CanvasContextLike & {
      image: (data: Uint8Array, options: { height: number; x: number; y: number }) => void;
    },
    size: number,
  ): Promise<void> {
    let img = this.getImageForSize(size);
    if (img != null) {
      let scale = size / this._font.unitsPerEm;
      let bbox = await this.getBBox();
      ctx.image(img.data, {
        height: size,
        x: img.originX,
        y: (bbox.minY - img.originY) * scale,
      });
    }

    if (this._font.sbix.flags.renderOutlines) {
      await super.render(ctx, size);
    }
  }
}
