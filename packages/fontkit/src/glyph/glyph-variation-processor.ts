import type { DecodeStream } from "@chr33s/restructure";
import type { VariationProcessor } from "./glyph.js";

const TUPLES_SHARE_POINT_NUMBERS = 0x8000;
const TUPLE_COUNT_MASK = 0x0fff;
const EMBEDDED_TUPLE_COORD = 0x8000;
const INTERMEDIATE_TUPLE = 0x4000;
const PRIVATE_POINT_NUMBERS = 0x2000;
const TUPLE_INDEX_MASK = 0x0fff;
const POINTS_ARE_WORDS = 0x80;
const POINT_RUN_COUNT_MASK = 0x7f;
const DELTAS_ARE_ZERO = 0x80;
const DELTAS_ARE_WORDS = 0x40;
const DELTA_RUN_COUNT_MASK = 0x3f;

type VariationAxis = {
  axisTag: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
};

type AvarCorrespondence = {
  fromCoord: number;
  toCoord: number;
};

type AvarSegment = {
  correspondence: AvarCorrespondence[];
};

type AvarTable = {
  segment: AvarSegment[];
};

type VariationRegionAxis = {
  startCoord: number;
  peakCoord: number;
  endCoord: number;
};

type VariationRegionList = {
  variationRegions: VariationRegionAxis[][];
};

type DeltaSet = {
  deltas: number[];
};

type ItemVariationData = {
  regionIndexCount: number;
  regionIndexes: number[];
  deltaSets: DeltaSet[];
};

type ItemVariationStore = {
  variationRegionList: VariationRegionList;
  itemVariationData: ItemVariationData[];
};

type DeltaSetIndexEntry = {
  outerIndex: number;
  innerIndex: number;
};

type DeltaSetIndexMap = {
  mapCount: number;
  mapData: DeltaSetIndexEntry[];
};

type HVARLike = {
  itemVariationStore: ItemVariationStore;
  advanceWidthMapping?: DeltaSetIndexMap;
};

type GvarTable = {
  glyphCount: number;
  axisCount: number;
  globalCoordCount: number;
  globalCoords: number[][];
  offsets: number[];
};

type VariationStream = DecodeStream & {
  pos: number;
  length: number;
  readUInt8(): number;
  readUInt16(): number;
  readUInt16BE(): number;
  readInt16BE(): number;
  readInt8(): number;
};

type VariationFont = {
  fvar?: { axis: VariationAxis[] };
  avar?: AvarTable;
  gvar?: GvarTable;
  stream: VariationStream;
};

type GlyphPoint = {
  x: number;
  y: number;
  endContour: boolean;
  copy(): GlyphPoint;
};

/**
 * This class is transforms TrueType glyphs according to the data from
 * the Apple Advanced Typography variation tables (fvar, gvar, and avar).
 * These tables allow infinite adjustments to glyph weight, width, slant,
 * and optical size without the designer needing to specify every exact style.
 *
 * Apple's documentation for these tables is not great, so thanks to the
 * Freetype project for figuring much of this out.
 *
 * @private
 */
export default class GlyphVariationProcessor implements VariationProcessor {
  private font: VariationFont;
  private normalizedCoords: number[];
  private blendVectors: Map<ItemVariationData, number[]>;

  constructor(font: VariationFont, coords: number[]) {
    this.font = font;
    this.normalizedCoords = this.normalizeCoords(coords);
    this.blendVectors = new Map();
  }

  getNormalizedCoords(): number[] {
    return this.normalizedCoords;
  }

  private normalizeCoords(coords: number[]): number[] {
    const axes = this.font.fvar?.axis ?? [];
    const normalized: number[] = [];

    for (let i = 0; i < axes.length; i++) {
      const axis = axes[i];
      const coord = coords[i] ?? axis.defaultValue;
      if (coord < axis.defaultValue) {
        normalized.push(
          (coord - axis.defaultValue + Number.EPSILON) /
            (axis.defaultValue - axis.minValue + Number.EPSILON),
        );
      } else {
        normalized.push(
          (coord - axis.defaultValue + Number.EPSILON) /
            (axis.maxValue - axis.defaultValue + Number.EPSILON),
        );
      }
    }

    const avar = this.font.avar;
    if (avar) {
      for (let i = 0; i < avar.segment.length; i++) {
        const segment = avar.segment[i];
        for (let j = 0; j < segment.correspondence.length; j++) {
          const pair = segment.correspondence[j];
          if (j >= 1 && normalized[i] < pair.fromCoord) {
            const prev = segment.correspondence[j - 1];
            normalized[i] =
              ((normalized[i] - prev.fromCoord) *
                (pair.toCoord - prev.toCoord) +
                Number.EPSILON) /
                (pair.fromCoord - prev.fromCoord + Number.EPSILON) +
              prev.toCoord;
            break;
          }
        }
      }
    }

    return normalized;
  }

  transformPoints(gid: number, glyphPoints: GlyphPoint[]): void {
    if (!this.font.fvar || !this.font.gvar) {
      return;
    }

    const { gvar } = this.font;
    if (gid >= gvar.glyphCount) {
      return;
    }

    const offset = gvar.offsets[gid];
    if (offset === gvar.offsets[gid + 1]) {
      return;
    }

    const { stream } = this.font;
    stream.pos = offset;
    if (stream.pos >= stream.length) {
      return;
    }

    let tupleCount = stream.readUInt16BE();
    let offsetToData = offset + stream.readUInt16BE();
    let sharedPoints: Uint16Array | null = null;

    if (tupleCount & TUPLES_SHARE_POINT_NUMBERS) {
      const here = stream.pos;
      stream.pos = offsetToData;
      sharedPoints = this.decodePoints();
      offsetToData = stream.pos;
      stream.pos = here;
    }

    const origPoints = glyphPoints.map((pt) => pt.copy());

    tupleCount &= TUPLE_COUNT_MASK;
    for (let i = 0; i < tupleCount; i++) {
      const tupleDataSize = stream.readUInt16BE();
      const tupleIndex = stream.readUInt16BE();

      let tupleCoords: number[];
      if (tupleIndex & EMBEDDED_TUPLE_COORD) {
        tupleCoords = [];
        for (let axis = 0; axis < gvar.axisCount; axis++) {
          tupleCoords.push(stream.readInt16BE() / 16384);
        }
      } else {
        const coordIndex = tupleIndex & TUPLE_INDEX_MASK;
        if (coordIndex >= gvar.globalCoordCount) {
          throw new Error("Invalid gvar table");
        }

        tupleCoords = gvar.globalCoords[coordIndex];
      }

      let startCoords: number[] | undefined;
      let endCoords: number[] | undefined;
      if (tupleIndex & INTERMEDIATE_TUPLE) {
        startCoords = [];
        endCoords = [];

        for (let axis = 0; axis < gvar.axisCount; axis++) {
          startCoords.push(stream.readInt16BE() / 16384);
        }

        for (let axis = 0; axis < gvar.axisCount; axis++) {
          endCoords.push(stream.readInt16BE() / 16384);
        }
      }

      const factor = this.tupleFactor(
        tupleIndex,
        tupleCoords,
        startCoords,
        endCoords,
      );
      if (factor === 0) {
        offsetToData += tupleDataSize;
        continue;
      }

      const here = stream.pos;
      stream.pos = offsetToData;

      const points =
        tupleIndex & PRIVATE_POINT_NUMBERS
          ? this.decodePoints()
          : (sharedPoints ?? new Uint16Array(0));

      const nPoints = points.length === 0 ? glyphPoints.length : points.length;
      const xDeltas = this.decodeDeltas(nPoints);
      const yDeltas = this.decodeDeltas(nPoints);

      if (points.length === 0) {
        for (let idx = 0; idx < glyphPoints.length; idx++) {
          const point = glyphPoints[idx];
          point.x += Math.round(xDeltas[idx] * factor);
          point.y += Math.round(yDeltas[idx] * factor);
        }
      } else {
        const outPoints = origPoints.map((pt) => pt.copy());
        const hasDelta = glyphPoints.map(() => false);

        for (let idx = 0; idx < points.length; idx++) {
          const pointIndex = points[idx];
          if (pointIndex < glyphPoints.length) {
            const point = outPoints[pointIndex];
            hasDelta[pointIndex] = true;
            point.x += Math.round(xDeltas[idx] * factor);
            point.y += Math.round(yDeltas[idx] * factor);
          }
        }

        this.interpolateMissingDeltas(outPoints, origPoints, hasDelta);

        for (let idx = 0; idx < glyphPoints.length; idx++) {
          const deltaX = outPoints[idx].x - origPoints[idx].x;
          const deltaY = outPoints[idx].y - origPoints[idx].y;
          glyphPoints[idx].x += deltaX;
          glyphPoints[idx].y += deltaY;
        }
      }

      offsetToData += tupleDataSize;
      stream.pos = here;
    }
  }

  private decodePoints(): Uint16Array {
    const stream = this.font.stream;
    let count = stream.readUInt8();

    if (count & POINTS_ARE_WORDS) {
      count = ((count & POINT_RUN_COUNT_MASK) << 8) | stream.readUInt8();
    }

    const points = new Uint16Array(count);
    let i = 0;
    let point = 0;
    while (i < count) {
      const run = stream.readUInt8();
      const runCount = (run & POINT_RUN_COUNT_MASK) + 1;
      const readValue =
        run & POINTS_ARE_WORDS
          ? () => stream.readUInt16()
          : () => stream.readUInt8();

      for (let j = 0; j < runCount && i < count; j++) {
        point += readValue();
        points[i++] = point;
      }
    }

    return points;
  }

  private decodeDeltas(count: number): Int16Array {
    const stream = this.font.stream;
    let i = 0;
    const deltas = new Int16Array(count);

    while (i < count) {
      const run = stream.readUInt8();
      const runCount = (run & DELTA_RUN_COUNT_MASK) + 1;

      if (run & DELTAS_ARE_ZERO) {
        i += runCount;
      } else {
        const readValue =
          run & DELTAS_ARE_WORDS
            ? () => stream.readInt16BE()
            : () => stream.readInt8();
        for (let j = 0; j < runCount && i < count; j++) {
          deltas[i++] = readValue();
        }
      }
    }

    return deltas;
  }

  private tupleFactor(
    tupleIndex: number,
    tupleCoords: number[],
    startCoords?: number[],
    endCoords?: number[],
  ): number {
    const normalized = this.normalizedCoords;
    const { gvar } = this.font;
    if (!gvar) {
      return 0;
    }

    let factor = 1;

    for (let i = 0; i < gvar.axisCount; i++) {
      if (tupleCoords[i] === 0) {
        continue;
      }

      if (normalized[i] === 0) {
        return 0;
      }

      if ((tupleIndex & INTERMEDIATE_TUPLE) === 0) {
        if (
          normalized[i] < Math.min(0, tupleCoords[i]) ||
          normalized[i] > Math.max(0, tupleCoords[i])
        ) {
          return 0;
        }

        factor =
          (factor * normalized[i] + Number.EPSILON) /
          (tupleCoords[i] + Number.EPSILON);
      } else {
        const start = startCoords?.[i] ?? 0;
        const end = endCoords?.[i] ?? 0;
        if (normalized[i] < start || normalized[i] > end) {
          return 0;
        } else if (normalized[i] < tupleCoords[i]) {
          factor =
            (factor * (normalized[i] - start + Number.EPSILON)) /
            (tupleCoords[i] - start + Number.EPSILON);
        } else {
          factor =
            (factor * (end - normalized[i] + Number.EPSILON)) /
            (end - tupleCoords[i] + Number.EPSILON);
        }
      }
    }

    return factor;
  }

  // Interpolates points without delta values.
  // Needed for the Ø and Q glyphs in Skia.
  // Algorithm from Freetype.
  interpolateMissingDeltas(
    points: GlyphPoint[],
    inPoints: GlyphPoint[],
    hasDelta: boolean[],
  ) {
    if (points.length === 0) {
      return;
    }

    let point = 0;
    while (point < points.length) {
      const firstPoint = point;

      // find the end point of the contour
      let endPoint = point;
      let contourPoint = points[endPoint];
      while (!contourPoint.endContour && endPoint + 1 < points.length) {
        contourPoint = points[++endPoint];
      }

      // find the first point that has a delta
      while (point <= endPoint && !hasDelta[point]) {
        point++;
      }

      if (point > endPoint) {
        continue;
      }

      const firstDelta = point;
      let curDelta = point;
      point++;

      while (point <= endPoint) {
        // find the next point with a delta, and interpolate intermediate points
        if (hasDelta[point]) {
          this.deltaInterpolate(
            curDelta + 1,
            point - 1,
            curDelta,
            point,
            inPoints,
            points,
          );
          curDelta = point;
        }

        point++;
      }

      // shift contour if we only have a single delta
      if (curDelta === firstDelta) {
        this.deltaShift(firstPoint, endPoint, curDelta, inPoints, points);
      } else {
        // otherwise, handle the remaining points at the end and beginning of the contour
        this.deltaInterpolate(
          curDelta + 1,
          endPoint,
          curDelta,
          firstDelta,
          inPoints,
          points,
        );

        if (firstDelta > 0) {
          this.deltaInterpolate(
            firstPoint,
            firstDelta - 1,
            curDelta,
            firstDelta,
            inPoints,
            points,
          );
        }
      }

      point = endPoint + 1;
    }
  }

  deltaInterpolate(
    p1: number,
    p2: number,
    ref1: number,
    ref2: number,
    inPoints: GlyphPoint[],
    outPoints: GlyphPoint[],
  ) {
    if (p1 > p2) {
      return;
    }

    const axes: Array<"x" | "y"> = ["x", "y"];
    for (const axis of axes) {
      let referenceA = ref1;
      let referenceB = ref2;
      if (inPoints[referenceA][axis] > inPoints[referenceB][axis]) {
        const swap = referenceA;
        referenceA = referenceB;
        referenceB = swap;
      }

      const in1 = inPoints[referenceA][axis];
      const in2 = inPoints[referenceB][axis];
      const out1 = outPoints[referenceA][axis];
      const out2 = outPoints[referenceB][axis];

      if (in1 !== in2 || out1 === out2) {
        const scale = in1 === in2 ? 0 : (out2 - out1) / (in2 - in1);

        for (let idx = p1; idx <= p2; idx++) {
          let out = inPoints[idx][axis];

          if (out <= in1) {
            out += out1 - in1;
          } else if (out >= in2) {
            out += out2 - in2;
          } else {
            out = out1 + (out - in1) * scale;
          }

          outPoints[idx][axis] = out;
        }
      }
    }
  }

  deltaShift(
    p1: number,
    p2: number,
    ref: number,
    inPoints: GlyphPoint[],
    outPoints: GlyphPoint[],
  ) {
    const deltaX = outPoints[ref].x - inPoints[ref].x;
    const deltaY = outPoints[ref].y - inPoints[ref].y;

    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    for (let idx = p1; idx <= p2; idx++) {
      if (idx !== ref) {
        outPoints[idx].x += deltaX;
        outPoints[idx].y += deltaY;
      }
    }
  }

  getAdvanceAdjustment(gid: number, table: HVARLike): number {
    let outerIndex: number;
    let innerIndex: number;

    if (table.advanceWidthMapping) {
      let idx = gid;
      if (idx >= table.advanceWidthMapping.mapCount) {
        idx = table.advanceWidthMapping.mapCount - 1;
      }

      ({ outerIndex, innerIndex } = table.advanceWidthMapping.mapData[idx]);
    } else {
      outerIndex = 0;
      innerIndex = gid;
    }

    return this.getDelta(table.itemVariationStore, outerIndex, innerIndex);
  }

  // See pseudo code from `Font Variations Overview'
  // in the OpenType specification.
  getDelta(
    itemStore: ItemVariationStore,
    outerIndex: number,
    innerIndex: number,
  ): number {
    if (outerIndex >= itemStore.itemVariationData.length) {
      return 0;
    }

    const varData = itemStore.itemVariationData[outerIndex];
    if (!varData) {
      return 0;
    }
    if (innerIndex >= varData.deltaSets.length) {
      return 0;
    }

    const deltaSet = varData.deltaSets[innerIndex];
    const blendVector = this.getBlendVector(itemStore, outerIndex);
    let netAdjustment = 0;

    for (let master = 0; master < varData.regionIndexCount; master++) {
      const delta = deltaSet.deltas[master] ?? 0;
      netAdjustment += delta * (blendVector[master] || 0);
    }

    return netAdjustment;
  }

  getBlendVector(
    itemStore: ItemVariationStore | null | undefined,
    outerIndex = 0,
  ): number[] {
    if (!itemStore) {
      return [];
    }

    const varData = itemStore.itemVariationData[outerIndex];
    const cached = this.blendVectors.get(varData);
    if (cached) {
      return cached;
    }

    const normalizedCoords = this.normalizedCoords;
    const blendVector: number[] = [];

    for (let master = 0; master < varData.regionIndexCount; master++) {
      let scalar = 1;
      const regionIndex = varData.regionIndexes[master];
      const axes =
        itemStore.variationRegionList.variationRegions[regionIndex] || [];

      for (let j = 0; j < axes.length; j++) {
        const axis = axes[j];
        let axisScalar: number;

        if (
          axis.startCoord > axis.peakCoord ||
          axis.peakCoord > axis.endCoord
        ) {
          axisScalar = 1;
        } else if (
          axis.startCoord < 0 &&
          axis.endCoord > 0 &&
          axis.peakCoord !== 0
        ) {
          axisScalar = 1;
        } else if (axis.peakCoord === 0) {
          axisScalar = 1;
        } else if (
          normalizedCoords[j] < axis.startCoord ||
          normalizedCoords[j] > axis.endCoord
        ) {
          axisScalar = 0;
        } else if (normalizedCoords[j] === axis.peakCoord) {
          axisScalar = 1;
        } else if (normalizedCoords[j] < axis.peakCoord) {
          axisScalar =
            (normalizedCoords[j] - axis.startCoord + Number.EPSILON) /
            (axis.peakCoord - axis.startCoord + Number.EPSILON);
        } else {
          axisScalar =
            (axis.endCoord - normalizedCoords[j] + Number.EPSILON) /
            (axis.endCoord - axis.peakCoord + Number.EPSILON);
        }

        scalar *= axisScalar;
      }

      blendVector[master] = scalar;
    }

    this.blendVectors.set(varData, blendVector);
    return blendVector;
  }
}
