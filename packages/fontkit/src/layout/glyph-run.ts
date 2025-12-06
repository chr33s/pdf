import BBox from "../glyph/b-box.js";
import type Glyph from "../glyph/glyph.js";
import type GlyphPosition from "./glyph-position.js";
import * as Script from "./script.js";

/**
 * Represents a run of Glyph and GlyphPosition objects.
 * Returned by the font layout method.
 */
export default class GlyphRun {
  glyphs: Glyph[];
  positions: GlyphPosition[] | null;
  script: string | string[];
  language: string | null;
  direction: string;
  features: Record<string, boolean>;

  constructor(
    glyphs: Glyph[],
    features: string[] | Record<string, boolean> | undefined,
    script: string | string[],
    language: string | null,
    direction: string | null,
  ) {
    this.glyphs = glyphs;

    this.positions = null;

    this.script = script;

    this.language = language || null;

    const scriptTag = Array.isArray(script) ? (script[0] ?? "DFLT") : script;
    this.direction = direction || Script.direction(scriptTag);

    this.features = {};

    // Convert features to an object
    if (Array.isArray(features)) {
      for (let tag of features) {
        this.features[tag] = true;
      }
    } else if (typeof features === "object") {
      this.features = features;
    }
  }

  /**
   * The total advance width of the run.
   */
  get advanceWidth() {
    if (!this.positions) {
      return 0;
    }

    let width = 0;
    for (let position of this.positions) {
      width += position.xAdvance;
    }

    return width;
  }

  /**
   * The total advance height of the run.
   */
  get advanceHeight() {
    if (!this.positions) {
      return 0;
    }

    let height = 0;
    for (let position of this.positions) {
      height += position.yAdvance;
    }

    return height;
  }

  /**
   * The bounding box containing all glyphs in the run.
   */
  async getBBox(): Promise<BBox> {
    if (!this.positions) {
      return new BBox();
    }

    let bbox = new BBox();

    let x = 0;
    let y = 0;
    for (let index = 0; index < this.glyphs.length; index++) {
      let glyph = this.glyphs[index];
      let p = this.positions[index];
      let b = await glyph.getBBox();

      bbox.addPoint(b.minX + x + p.xOffset, b.minY + y + p.yOffset);
      bbox.addPoint(b.maxX + x + p.xOffset, b.maxY + y + p.yOffset);

      x += p.xAdvance;
      y += p.yAdvance;
    }

    return bbox;
  }
}
