/**
 * Represents positioning information for a glyph in a GlyphRun.
 */
export default class GlyphPosition {
  xAdvance: number;
  yAdvance: number;
  xOffset: number;
  yOffset: number;
  constructor(xAdvance = 0, yAdvance = 0, xOffset = 0, yOffset = 0) {
    this.xAdvance = xAdvance;

    this.yAdvance = yAdvance;

    this.xOffset = xOffset;

    this.yOffset = yOffset;
  }
}
