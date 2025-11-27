import { unicode } from "@chr33s/unicode-properties";
import { cache } from "../decorators.js";
import Path from "./path.js";
import StandardNames from "./standard-names.js";

type MetricRecord = {
  advance: number;
  bearing: number;
};

type MetricArray = {
  length: number;
  get(index: number): MetricRecord | undefined;
};

type BearingArray = {
  get(index: number): number | undefined;
};

export type MetricTable = {
  metrics: MetricArray;
  bearings: BearingArray;
};

type GlyphPointLike = {
  x: number;
  y: number;
  endContour?: boolean;
  copy(): GlyphPointLike;
};

export type GlyphImage = {
  originX: number;
  originY: number;
  type: string;
  data: Buffer;
};

type CmapProcessorLike = {
  codePointsForGlyph(gid: number): number[];
};

export type VariationProcessor = {
  getAdvanceAdjustment(gid: number, table: unknown): number;
  getBlendVector(itemStore: unknown, outerIndex?: number): number[];
  getDelta(itemStore: unknown, outerIndex: number, innerIndex: number): number;
  transformPoints(gid: number, points: GlyphPointLike[]): void;
  getNormalizedCoords(): number[];
};

export type FontLike = {
  unitsPerEm: number;
  head: { unitsPerEm: number };
  hhea: { ascent: number; descent: number };
  hmtx: MetricTable;
  vmtx?: MetricTable | null;
  HVAR?: unknown;
  morx?: unknown;
  GSUB?: unknown;
  GPOS?: unknown;
  kern?: { tables?: unknown[] } | null;
  glyphsForString(text: string): Glyph[];
  glyphForCodePoint(codePoint: number): Glyph;
  getGlyph(glyphId: number, codePoints?: number[]): Glyph;
  _cmapProcessor: CmapProcessorLike;
  _variationProcessor?: VariationProcessor | null;
  [key: string]: any;
};

type GlyphMetrics = {
  advanceWidth: number;
  advanceHeight: number;
  leftBearing: number;
  topBearing: number;
  width: number;
  height: number;
  rightBearing: number;
  bottomBearing: number;
};

export type CanvasContextLike = {
  save(): void;
  scale(x: number, y: number): void;
  fill(): void;
  restore(): void;
  [key: string]: (...args: number[]) => unknown;
};

/**
 * Glyph objects represent a glyph in the font. They have various properties for accessing metrics and
 * the actual vector path the glyph represents, and methods for rendering the glyph to a graphics context.
 *
 * You do not create glyph objects directly. They are created by various methods on the font object.
 * There are several subclasses of the base Glyph class internally that may be returned depending
 * on the font format, but they all inherit from this class.
 */
export default class Glyph {
  [key: string]: unknown;
  id: number;
  codePoints: number[];
  protected _font: FontLike;
  protected _metrics: GlyphMetrics | null;
  isMark: boolean;
  isLigature: boolean;

  constructor(id: number, codePoints: number[], font: FontLike) {
    /**
     * The glyph id in the font
     * @type {number}
     */
    this.id = id;

    /**
     * An array of unicode code points that are represented by this glyph.
     * There can be multiple code points in the case of ligatures and other glyphs
     * that represent multiple visual characters.
     * @type {number[]}
     */
    this.codePoints = codePoints;
    this._font = font;
    this._metrics = null;

    // TODO: get this info from GDEF if available
    this.isMark = this.codePoints.length > 0 && this.codePoints.every(unicode.isMark);
    this.isLigature = this.codePoints.length > 1;
  }

  _getPath(): Path {
    return new Path();
  }

  _getCBox() {
    return this.path.cbox;
  }

  _getBBox() {
    return this.path.bbox;
  }

  _getTableMetrics(table: MetricTable): MetricRecord {
    if (this.id < table.metrics.length) {
      const metric = table.metrics.get(this.id);
      if (metric) {
        return metric;
      }
    }

    const metric = table.metrics.get(table.metrics.length - 1);
    const bearing = table.bearings.get(this.id - table.metrics.length) || 0;
    const fallbackAdvance = metric ? metric.advance : 0;
    const res: MetricRecord = {
      advance: fallbackAdvance,
      bearing,
    };

    return res;
  }

  _getMetrics(cbox?: { maxY: number; width: number; height: number } | null): GlyphMetrics {
    if (this._metrics) {
      return this._metrics;
    }
    if (typeof cbox === "undefined" || cbox === null) {
      ({ cbox } = this);
    }

    const { advance: advanceWidthRaw, bearing: leftBearing } = this._getTableMetrics(
      this._font.hmtx,
    );
    let advanceWidth = advanceWidthRaw;

    // For vertical metrics, use vmtx if available, or fall back to global data
    if (this._font.vmtx) {
      var { advance: advanceHeight, bearing: topBearing } = this._getTableMetrics(this._font.vmtx);
    } else {
      if (typeof cbox === "undefined" || cbox === null) {
        ({ cbox } = this);
      }

      var advanceHeight = Math.abs(this._font.ascent - this._font.descent);
      var topBearing = this._font.ascent - cbox.maxY;
    }

    if (this._font._variationProcessor && this._font.HVAR) {
      advanceWidth += this._font._variationProcessor.getAdvanceAdjustment(this.id, this._font.HVAR);
    }

    let width = cbox.width;
    let height = cbox.height;
    let rightBearing = advanceWidth - leftBearing - width;
    let bottomBearing = advanceHeight - topBearing - height;

    return (this._metrics = {
      width,
      height,
      advanceWidth,
      advanceHeight,
      leftBearing,
      topBearing,
      rightBearing,
      bottomBearing,
    });
  }

  /**
   * The glyph’s control box.
   * This is often the same as the bounding box, but is faster to compute.
   * Because of the way bezier curves are defined, some of the control points
   * can be outside of the bounding box. Where `bbox` takes this into account,
   * `cbox` does not. Thus, cbox is less accurate, but faster to compute.
   * See [here](http://www.freetype.org/freetype2/docs/glyphs/glyphs-6.html#section-2)
   * for a more detailed description.
   *
   * @type {BBox}
   */
  @cache
  get cbox() {
    return this._getCBox();
  }

  /**
   * The glyph’s bounding box, i.e. the rectangle that encloses the
   * glyph outline as tightly as possible.
   * @type {BBox}
   */
  @cache
  get bbox() {
    return this._getBBox();
  }

  /**
   * A vector Path object representing the glyph outline.
   * @type {Path}
   */
  @cache
  get path() {
    // Cache the path so we only decode it once
    // Decoding is actually performed by subclasses
    return this._getPath();
  }

  /**
   * Returns a path scaled to the given font size.
   * @param {number} size
   * @return {Path}
   */
  getScaledPath(size: number): Path {
    let scale = (1 / this._font.unitsPerEm) * size;
    return this.path.scale(scale);
  }

  /**
   * The glyph's advance width.
   * @type {number}
   */
  @cache
  get advanceWidth(): number {
    return this._getMetrics().advanceWidth;
  }

  /**
   * The glyph's width.
   * @type {number}
   */
  @cache
  get width() {
    return this._getMetrics().width;
  }

  /**
   * The glyph's height.
   * @type {number}
   */
  @cache
  get height() {
    return this._getMetrics().height;
  }

  /**
   * The glyph's advance height.
   * @type {number}
   */
  @cache
  get advanceHeight(): number {
    return this._getMetrics().advanceHeight;
  }

  /**
   * The glyph's left side bearing.
   * @type {number}
   */
  @cache
  get leftBearing() {
    return this._getMetrics().leftBearing;
  }

  /**
   * The glyph's top side bearing.
   * @type {number}
   */
  @cache
  get topBearing() {
    return this._getMetrics().topBearing;
  }

  /**
   * The glyph's right side bearing.
   * @type {number}
   */
  @cache
  get rightBearing() {
    return this._getMetrics().rightBearing;
  }

  /**
   * The glyph's bottom side bearing.
   * @type {number}
   */
  @cache
  get bottomBearing() {
    return this._getMetrics().bottomBearing;
  }

  get ligatureCaretPositions(): number[] | null {
    return null;
  }

  get layers(): unknown[] {
    return [];
  }

  getImageForSize(_size: number): GlyphImage | null {
    return null;
  }

  _getName() {
    let { post } = this._font;
    if (!post) {
      return null;
    }

    switch (post.version) {
      case 1:
        return StandardNames[this.id];

      case 2:
        let id = post.glyphNameIndex[this.id];
        if (id < StandardNames.length) {
          return StandardNames[id];
        }

        return post.names[id - StandardNames.length];

      case 2.5:
        return StandardNames[this.id + post.offsets[this.id]];

      case 4:
        return String.fromCharCode(post.map[this.id]);
    }
  }

  /**
   * The glyph's name
   * @type {string}
   */
  @cache
  get name() {
    return this._getName();
  }

  /**
   * Renders the glyph to the given graphics context, at the specified font size.
   * @param {CanvasRenderingContext2d} ctx
   * @param {number} size
   */
  render(ctx: CanvasContextLike, size: number): void {
    ctx.save();

    let scale = (1 / this._font.head.unitsPerEm) * size;
    ctx.scale(scale, scale);

    let fn = this.path.toFunction();
    fn(ctx);
    ctx.fill();

    ctx.restore();
  }
}
