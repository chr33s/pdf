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
    /**
     * An array of Glyph objects in the run
     * @type {Glyph[]}
     */
    this.glyphs = glyphs;

    /**
     * An array of GlyphPosition objects for each glyph in the run
     * @type {GlyphPosition[]}
     */
    this.positions = null;

    /**
     * The script that was requested for shaping. This was either passed in or detected automatically.
     * @type {string|string[]}
     */
    this.script = script;

    /**
     * The language requested for shaping, as passed in. If `null`, the default language for the
     * script was used.
     * @type {string}
     */
    this.language = language || null;

    /**
     * The direction requested for shaping, as passed in (either ltr or rtl).
     * If `null`, the default direction of the script is used.
     * @type {string}
     */
    const scriptTag = Array.isArray(script) ? (script[0] ?? "DFLT") : script;
    this.direction = direction || Script.direction(scriptTag);

    /**
     * The features requested during shaping. This is a combination of user
     * specified features and features chosen by the shaper.
     * @type {object}
     */
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
   * @type {number}
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
   * @type {number}
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
   * @type {BBox}
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

  /**
   * Returns visual metrics for the glyph run, useful for accurate text centering.
   *
   * The `visualOffset` values represent the difference between the mathematical
   * center (based on advance widths) and the visual center (based on actual ink).
   *
   * To visually center text, subtract `visualOffset.x` from your x position after
   * mathematical centering, or use `visualCenter.x` directly.
   *
   * @returns Visual metrics including bounding box, visual width/height, and offset from advance-based metrics
   */
  async getVisualMetrics(): Promise<{
    /** Bounding box of actual ink/visual content */
    bbox: BBox;
    /** Width of visual content (may differ from advanceWidth) */
    visualWidth: number;
    /** Height of visual content */
    visualHeight: number;
    /** Left side bearing: empty space before first glyph's ink */
    leftBearing: number;
    /** Right side bearing: empty space after last glyph's ink */
    rightBearing: number;
    /** Offset to apply for visual centering (subtract from x/y after mathematical centering) */
    visualOffset: { x: number; y: number };
    /** The visual center point relative to the run's origin */
    visualCenter: { x: number; y: number };
  }> {
    const bbox = await this.getBBox();
    const advanceWidth = this.advanceWidth;
    const advanceHeight = this.advanceHeight;

    const visualWidth = bbox.width;
    const visualHeight = bbox.height;

    // Left bearing is the distance from origin (0) to where ink starts (bbox.minX)
    const leftBearing = bbox.minX;
    // Right bearing is the distance from where ink ends to the advance width
    const rightBearing = advanceWidth - bbox.maxX;

    // Mathematical center is at advanceWidth / 2
    // Visual center of ink is at (bbox.minX + bbox.maxX) / 2
    // The offset needed to shift from mathematical to visual center:
    const visualOffsetX = (leftBearing - rightBearing) / 2;
    const visualOffsetY = (bbox.minY + bbox.maxY) / 2 - advanceHeight / 2;

    // Visual center relative to origin
    const visualCenterX = (bbox.minX + bbox.maxX) / 2;
    const visualCenterY = (bbox.minY + bbox.maxY) / 2;

    return {
      bbox,
      visualWidth,
      visualHeight,
      leftBearing,
      rightBearing,
      visualOffset: { x: visualOffsetX, y: visualOffsetY },
      visualCenter: { x: visualCenterX, y: visualCenterY },
    };
  }
}
