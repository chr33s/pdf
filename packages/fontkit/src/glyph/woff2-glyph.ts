import BBox from "./b-box.js";
import TTFGlyph from "./ttf-glyph.js";

/**
 * Represents a TrueType glyph in the WOFF2 format, which compresses glyphs differently.
 */
export default class WOFF2Glyph extends TTFGlyph {
  _decode() {
    // We have to decode in advance (in WOFF2Font), so just return the pre-decoded data.
    return this._font._transformedGlyphs[this.id];
  }

  async _getCBox(internal?: boolean): Promise<BBox> {
    if (this._font._variationProcessor && !internal) {
      const path = await this.getPath();
      return path.cbox;
    }

    const glyph = this._decode();
    if (!glyph) {
      return Object.freeze(new BBox(0, 0, 0, 0));
    }

    const bbox = new BBox();
    if (glyph.numberOfContours >= 0 && glyph.points) {
      for (const point of glyph.points) {
        bbox.addPoint(point.x, point.y);
      }
    } else if (glyph.numberOfContours < 0 && glyph.components) {
      for (const component of glyph.components) {
        const baseGlyph = this._font.getGlyph(component.glyphID);
        const componentBox = await baseGlyph.getCBox();
        const corners = [
          [componentBox.minX, componentBox.minY],
          [componentBox.minX, componentBox.maxY],
          [componentBox.maxX, componentBox.minY],
          [componentBox.maxX, componentBox.maxY],
        ] as const;

        for (const [x, y] of corners) {
          const transformedX = x * component.scaleX + y * component.scale01 + component.dx;
          const transformedY = y * component.scaleY + x * component.scale10 + component.dy;
          bbox.addPoint(transformedX, transformedY);
        }
      }
    }

    if (
      bbox.minX === Infinity ||
      bbox.minY === Infinity ||
      bbox.maxX === -Infinity ||
      bbox.maxY === -Infinity
    ) {
      return Object.freeze(new BBox(0, 0, 0, 0));
    }

    return Object.freeze(bbox);
  }
}
