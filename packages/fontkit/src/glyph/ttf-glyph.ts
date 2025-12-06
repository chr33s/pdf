import type { DecodeStream } from "@chr33s/pdf-restructure";
import * as r from "@chr33s/pdf-restructure";
import BBox from "./b-box.js";
import Glyph, { type GlyphMetrics } from "./glyph.js";
import Path from "./path.js";

// The header for both simple and composite glyphs
let GlyfHeader = new r.Struct({
  numberOfContours: r.int16, // if negative, this is a composite glyph
  xMin: r.int16,
  yMin: r.int16,
  xMax: r.int16,
  yMax: r.int16,
});

// Flags for simple glyphs
const ON_CURVE = 1 << 0;
const X_SHORT_VECTOR = 1 << 1;
const Y_SHORT_VECTOR = 1 << 2;
const REPEAT = 1 << 3;
const SAME_X = 1 << 4;
const SAME_Y = 1 << 5;

// Flags for composite glyphs
const ARG_1_AND_2_ARE_WORDS = 1 << 0;
const _ARGS_ARE_XY_VALUES = 1 << 1;
const _ROUND_XY_TO_GRID = 1 << 2;
const WE_HAVE_A_SCALE = 1 << 3;
const MORE_COMPONENTS = 1 << 5;
const WE_HAVE_AN_X_AND_Y_SCALE = 1 << 6;
const WE_HAVE_A_TWO_BY_TWO = 1 << 7;
const WE_HAVE_INSTRUCTIONS = 1 << 8;
const _USE_MY_METRICS = 1 << 9;
const _OVERLAP_COMPOUND = 1 << 10;
const _SCALED_COMPONENT_OFFSET = 1 << 11;
const _UNSCALED_COMPONENT_OFFSET = 1 << 12;

// Represents a point in a simple glyph
export class Point {
  onCurve: boolean;
  endContour: boolean;
  x: number;
  y: number;

  constructor(onCurve: boolean, endContour: boolean, x = 0, y = 0) {
    this.onCurve = onCurve;
    this.endContour = endContour;
    this.x = x;
    this.y = y;
  }

  copy(): Point {
    return new Point(this.onCurve, this.endContour, this.x, this.y);
  }
}

// Represents a component in a composite glyph
class Component {
  glyphID: number;
  dx: number;
  dy: number;
  pos: number;
  scaleX: number;
  scaleY: number;
  scale01: number;
  scale10: number;

  constructor(glyphID: number, dx: number, dy: number) {
    this.glyphID = glyphID;
    this.dx = dx;
    this.dy = dy;
    this.pos = 0;
    this.scaleX = this.scaleY = 1;
    this.scale01 = this.scale10 = 0;
  }
}

/**
 * Represents a TrueType glyph.
 */
export default class TTFGlyph extends Glyph {
  // Parses just the glyph header and returns the bounding box
  async _getCBox(internal?: boolean): Promise<BBox> {
    // We need to decode the glyph if variation processing is requested,
    // so it's easier just to recompute the path's cbox after decoding.
    if (this._font._variationProcessor && !internal) {
      const path = await this.getPath();
      return path.cbox;
    }

    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];

    // No data for this glyph (space?)
    if (glyfPos === nextPos) {
      return super._getCBox();
    }

    let stream = this._font._getTableStream("glyf");
    stream.pos += glyfPos;

    let glyph = GlyfHeader.decode(stream);

    let cbox = new BBox(glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax);
    return Object.freeze(cbox);
  }

  // Parses a single glyph coordinate
  _parseGlyphCoord(stream: DecodeStream, prev: number, short: number, same: number): number {
    let value: number;
    if (short) {
      value = stream.readUInt8();
      if (!same) {
        value = -value;
      }

      value += prev;
    } else {
      value = same ? prev : prev + stream.readInt16BE();
    }

    return value;
  }

  // Decodes the glyph data into points for simple glyphs,
  // or components for composite glyphs
  async _decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];

    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) {
      return null;
    }

    let stream = this._font._getTableStream("glyf");
    stream.pos += glyfPos;
    let startPos = stream.pos;

    let glyph = GlyfHeader.decode(stream);

    if (glyph.numberOfContours > 0) {
      await this._decodeSimple(glyph, stream);
    } else if (glyph.numberOfContours < 0) {
      await this._decodeComposite(glyph, stream, startPos);
    }

    return glyph;
  }

  async _decodeSimple(glyph: any, stream: DecodeStream) {
    // this is a simple glyph
    glyph.points = [];

    let endPtsOfContours = new r.Array(r.uint16, glyph.numberOfContours).decode(stream) as number[];
    glyph.instructions = new r.Array(r.uint8, r.uint16).decode(stream) as number[];

    let flags: number[] = [];
    let numCoords = endPtsOfContours[endPtsOfContours.length - 1] + 1;

    while (flags.length < numCoords) {
      const flag = stream.readUInt8();
      flags.push(flag);

      // check for repeat flag
      if (flag & REPEAT) {
        let count = stream.readUInt8();
        for (let j = 0; j < count; j++) {
          flags.push(flag);
        }
      }
    }

    for (let i = 0; i < flags.length; i++) {
      const flag = flags[i];
      let point = new Point(!!(flag & ON_CURVE), endPtsOfContours.indexOf(i) >= 0, 0, 0);
      glyph.points.push(point);
    }

    let px = 0;
    for (let i = 0; i < flags.length; i++) {
      const flag = flags[i];
      glyph.points[i].x = px = this._parseGlyphCoord(
        stream,
        px,
        flag & X_SHORT_VECTOR,
        flag & SAME_X,
      );
    }

    let py = 0;
    for (let i = 0; i < flags.length; i++) {
      const flag = flags[i];
      glyph.points[i].y = py = this._parseGlyphCoord(
        stream,
        py,
        flag & Y_SHORT_VECTOR,
        flag & SAME_Y,
      );
    }

    if (this._font._variationProcessor) {
      let points = glyph.points.slice();
      points.push(...(await this._getPhantomPoints(glyph)));

      this._font._variationProcessor.transformPoints(this.id, points);
      glyph.phantomPoints = points.slice(-4);
    }

    return;
  }

  async _decodeComposite(glyph: any, stream: DecodeStream, offset = 0) {
    // this is a composite glyph
    glyph.components = [];
    let haveInstructions = false;
    let flags = MORE_COMPONENTS;

    while (flags & MORE_COMPONENTS) {
      flags = stream.readUInt16BE();
      let gPos = stream.pos - offset;
      let glyphID = stream.readUInt16BE();
      if (!haveInstructions) {
        haveInstructions = (flags & WE_HAVE_INSTRUCTIONS) !== 0;
      }

      let dx: number;
      let dy: number;
      if (flags & ARG_1_AND_2_ARE_WORDS) {
        dx = stream.readInt16BE();
        dy = stream.readInt16BE();
      } else {
        dx = stream.readInt8();
        dy = stream.readInt8();
      }

      const component = new Component(glyphID, dx, dy);
      component.pos = gPos;

      if (flags & WE_HAVE_A_SCALE) {
        // fixed number with 14 bits of fraction
        component.scaleX = component.scaleY =
          ((stream.readUInt8() << 24) | (stream.readUInt8() << 16)) / 1073741824;
      } else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) {
        component.scaleX = ((stream.readUInt8() << 24) | (stream.readUInt8() << 16)) / 1073741824;
        component.scaleY = ((stream.readUInt8() << 24) | (stream.readUInt8() << 16)) / 1073741824;
      } else if (flags & WE_HAVE_A_TWO_BY_TWO) {
        component.scaleX = ((stream.readUInt8() << 24) | (stream.readUInt8() << 16)) / 1073741824;
        component.scale01 = ((stream.readUInt8() << 24) | (stream.readUInt8() << 16)) / 1073741824;
        component.scale10 = ((stream.readUInt8() << 24) | (stream.readUInt8() << 16)) / 1073741824;
        component.scaleY = ((stream.readUInt8() << 24) | (stream.readUInt8() << 16)) / 1073741824;
      }

      glyph.components.push(component);
    }

    if (this._font._variationProcessor) {
      let points = [];
      for (let j = 0; j < glyph.components.length; j++) {
        const component = glyph.components[j];
        points.push(new Point(true, true, component.dx, component.dy));
      }

      points.push(...(await this._getPhantomPoints(glyph)));

      this._font._variationProcessor.transformPoints(this.id, points);
      glyph.phantomPoints = points.splice(-4, 4);

      for (let i = 0; i < points.length; i++) {
        let point = points[i];
        glyph.components[i].dx = point.x;
        glyph.components[i].dy = point.y;
      }
    }

    return haveInstructions;
  }

  async _getPhantomPoints(glyph: any) {
    let cbox = await this._getCBox(true);
    if (this._metrics == null) {
      this._metrics = await Glyph.prototype._getMetrics.call(this, cbox);
    }

    let { advanceWidth, advanceHeight, leftBearing, topBearing } = this._metrics;

    return [
      new Point(false, true, glyph.xMin - leftBearing, 0),
      new Point(false, true, glyph.xMin - leftBearing + advanceWidth, 0),
      new Point(false, true, 0, glyph.yMax + topBearing),
      new Point(false, true, 0, glyph.yMax + topBearing + advanceHeight),
    ];
  }

  // Decodes font data, resolves composite glyphs, and returns an array of contours
  async _getContours(): Promise<Point[][]> {
    let glyph = await this._decode();
    if (!glyph) {
      return [];
    }

    let points: Point[] = [];

    if (glyph.numberOfContours < 0) {
      // resolve composite glyphs
      for (let component of glyph.components) {
        let baseGlyph = this._font.getGlyph(component.glyphID);
        if (!(baseGlyph instanceof TTFGlyph)) {
          continue;
        }

        let contours = await baseGlyph._getContours();
        for (let i = 0; i < contours.length; i++) {
          let contour = contours[i];
          for (let j = 0; j < contour.length; j++) {
            let point = contour[j];
            let x = point.x * component.scaleX + point.y * component.scale01 + component.dx;
            let y = point.y * component.scaleY + point.x * component.scale10 + component.dy;
            points.push(new Point(point.onCurve, point.endContour, x, y));
          }
        }
      }
    } else {
      points = glyph.points || [];
    }

    // Recompute and cache metrics if we performed variation processing, and don't have an HVAR table
    if (!this._metrics) {
      const cbox = await this._getCBox(true);
      this._metrics = await Glyph.prototype._getMetrics.call(this, cbox);
    }

    if (glyph.phantomPoints && !this._font.directory.tables.HVAR && this._metrics) {
      const phantomPoints = glyph.phantomPoints;
      this._metrics.advanceWidth = phantomPoints[1].x - phantomPoints[0].x;
      this._metrics.advanceHeight = phantomPoints[3].y - phantomPoints[2].y;
      this._metrics.leftBearing = glyph.xMin - phantomPoints[0].x;
      this._metrics.topBearing = phantomPoints[2].y - glyph.yMax;
    }

    let contours: Point[][] = [];
    let cur: Point[] = [];
    for (let k = 0; k < points.length; k++) {
      let point = points[k];
      cur.push(point);
      if (point.endContour) {
        contours.push(cur);
        cur = [];
      }
    }

    return contours;
  }

  override async _getMetrics(cbox?: { maxY: number } | null): Promise<GlyphMetrics> {
    if (this._metrics) {
      return this._metrics;
    }

    const localCbox = await this._getCBox(true);
    await super._getMetrics(localCbox);

    if (this._font._variationProcessor && !this._font.HVAR) {
      // No HVAR table, decode the glyph. This triggers recomputation of metrics.
      await this.getPath();
    }

    return this._metrics!;
  }

  // Converts contours to a Path object that can be rendered
  async _getPath(): Promise<Path> {
    let contours = await this._getContours();
    let path = new Path();

    for (let i = 0; i < contours.length; i++) {
      let contour = contours[i];
      let firstPt = contour[0];
      let lastPt = contour[contour.length - 1];
      let start = 0;

      let curvePt: Point | null;
      if (firstPt.onCurve) {
        // The first point will be consumed by the moveTo command, so skip in the loop
        curvePt = null;
        start = 1;
      } else {
        if (lastPt.onCurve) {
          // Start at the last point if the first point is off curve and the last point is on curve
          firstPt = lastPt;
        } else {
          // Start at the middle if both the first and last points are off curve
          firstPt = new Point(false, false, (firstPt.x + lastPt.x) / 2, (firstPt.y + lastPt.y) / 2);
        }

        curvePt = firstPt;
      }

      path.moveTo(firstPt.x, firstPt.y);

      for (let j = start; j < contour.length; j++) {
        let pt = contour[j];
        let prevPt = j === 0 ? firstPt : contour[j - 1];

        if (prevPt.onCurve && pt.onCurve) {
          path.lineTo(pt.x, pt.y);
        } else if (prevPt.onCurve && !pt.onCurve) {
          curvePt = pt;
        } else if (!prevPt.onCurve && !pt.onCurve) {
          let midX = (prevPt.x + pt.x) / 2;
          let midY = (prevPt.y + pt.y) / 2;
          path.quadraticCurveTo(prevPt.x, prevPt.y, midX, midY);
          curvePt = pt;
        } else if (!prevPt.onCurve && pt.onCurve) {
          if (!curvePt) {
            throw new Error("Quadratic curve control point missing");
          }

          path.quadraticCurveTo(curvePt.x, curvePt.y, pt.x, pt.y);
          curvePt = null;
        } else {
          throw new Error("Unknown TTF path state");
        }
      }

      // Connect the first and last points
      if (curvePt) {
        path.quadraticCurveTo(curvePt.x, curvePt.y, firstPt.x, firstPt.y);
      }

      path.closePath();
    }

    return path;
  }
}
