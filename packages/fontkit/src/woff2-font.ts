import { decompress } from "@chr33s/brotli";
import * as r from "@chr33s/restructure";
import type { FontLike } from "./glyph/glyph.js";
import TTFGlyph, { Point } from "./glyph/ttf-glyph.js";
import WOFF2Glyph from "./glyph/woff2-glyph.js";
import WOFF2Directory from "./tables/woff2-directory.js";
import TTFFont from "./ttf-font.js";

type DecodeStream = InstanceType<typeof r.DecodeStream>;
type RestructureBuffer = InstanceType<typeof r.Buffer>;
type TTDirectoryData = TTFFont["directory"];

type WOFF2DirectoryEntry = {
  tag: string;
  length: number;
  transformed: boolean;
  transformLength?: number | null;
  offset: number;
};

type WOFF2DirectoryData = {
  tables: Record<string, WOFF2DirectoryEntry>;
  totalCompressedSize: number;
};

type MutablePoint = Point & { endContour?: boolean };

type TransformedGlyph = {
  numberOfContours: number;
  points?: MutablePoint[];
  components?: unknown;
};

type GlyfTableData = {
  version: number;
  numGlyphs: number;
  indexFormat: number;
  nContourStreamSize: number;
  nPointsStreamSize: number;
  flagStreamSize: number;
  glyphStreamSize: number;
  compositeStreamSize: number;
  bboxStreamSize: number;
  instructionStreamSize: number;
  nContours: DecodeStream;
  nPoints: DecodeStream;
  flags: DecodeStream;
  glyphs: DecodeStream;
  composites: DecodeStream;
  bboxes: DecodeStream;
  instructions: DecodeStream;
};

/**
 * Subclass of TTFFont that represents a TTF/OTF font compressed by WOFF2
 * See spec here: http://www.w3.org/TR/WOFF2/
 */
export default class WOFF2Font extends TTFFont {
  declare directory: TTDirectoryData & WOFF2DirectoryData;
  declare stream: DecodeStream;
  declare protected _glyphs: Partial<Record<number, TTFGlyph>>;
  declare protected _dataPos: number;
  protected _decompressed = false;
  protected _transformedGlyphs: TransformedGlyph[] | null = null;

  static probe(buffer: Buffer): boolean {
    return buffer.toString("ascii", 0, 4) === "wOF2";
  }

  _decodeDirectory(): TTDirectoryData & WOFF2DirectoryData {
    this.directory = WOFF2Directory.decode(this.stream) as TTDirectoryData &
      WOFF2DirectoryData;
    for (let entry of Object.values(this.directory.tables)) {
      entry.offset = 0;
    }
    this._dataPos = this.stream.pos;
    return this.directory;
  }

  _decompress(): void {
    // decompress data and setup table offsets if we haven't already
    if (!this._decompressed) {
      this.stream.pos = this._dataPos;
      const buffer = this.stream.readBuffer(this.directory.totalCompressedSize);

      let decompressedSize = 0;
      for (let tag in this.directory.tables) {
        const entry = this.directory.tables[tag];
        entry.offset = decompressedSize;
        decompressedSize +=
          entry.transformLength != null ? entry.transformLength : entry.length;
      }

      const decompressed = decompress(buffer);
      if (!decompressed) {
        throw new Error("Error decoding compressed data in WOFF2");
      }

      this.stream = new r.DecodeStream(Buffer.from(decompressed));
      this._decompressed = true;
    }
  }

  _decodeTable(table: WOFF2DirectoryEntry): unknown {
    this._decompress();
    return super._decodeTable(table);
  }

  // Override this method to get a glyph and return our
  // custom subclass if there is a glyf table.
  _getBaseGlyph(glyph: number, characters: number[] = []): TTFGlyph {
    if (!this._glyphs[glyph]) {
      const glyfTable = this.directory.tables.glyf;
      if (glyfTable && glyfTable.transformed) {
        if (!this._transformedGlyphs) {
          this._transformGlyfTable();
        }

        const fontRef = this as unknown as FontLike;
        this._glyphs[glyph] = new WOFF2Glyph(glyph, characters, fontRef);
      } else {
        return super._getBaseGlyph(glyph, characters) as TTFGlyph;
      }
    }

    const glyphInstance = this._glyphs[glyph];
    if (!glyphInstance) {
      throw new Error(`Unable to load WOFF2 glyph ${glyph}`);
    }

    return glyphInstance;
  }

  _transformGlyfTable(): void {
    this._decompress();
    const glyfTable = this.directory.tables.glyf;
    if (!glyfTable || typeof glyfTable.offset !== "number") {
      throw new Error("Invalid glyf table offset");
    }

    this.stream.pos = glyfTable.offset;
    const table = GlyfTable.decode(this.stream);
    const glyphs: TransformedGlyph[] = [];

    for (let index = 0; index < table.numGlyphs; index++) {
      const nContours = table.nContours.readInt16BE();
      const glyph: TransformedGlyph = { numberOfContours: nContours };

      if (nContours > 0) {
        // simple glyph
        const nPoints: number[] = [];
        let totalPoints = 0;

        for (let i = 0; i < nContours; i++) {
          const r = read255UInt16(table.nPoints);
          totalPoints += r;
          nPoints.push(totalPoints);
        }

        glyph.points = decodeTriplet(table.flags, table.glyphs, totalPoints);
        for (let i = 0; i < nContours; i++) {
          const contourIndex = nPoints[i] - 1;
          const points = glyph.points;
          if (points && points[contourIndex]) {
            points[contourIndex].endContour = true;
          }
        }

        read255UInt16(table.glyphs);
      } else if (nContours < 0) {
        // composite glyph
        const haveInstructions = TTFGlyph.prototype._decodeComposite.call(
          { _font: this },
          glyph,
          table.composites,
        );
        if (haveInstructions) {
          read255UInt16(table.glyphs);
        }
      }

      glyphs.push(glyph);
    }

    this._transformedGlyphs = glyphs;
  }
}

// Special class that accepts a length and returns a sub-stream for that data
class Substream {
  readonly length: r.LengthLike;
  #buffer: RestructureBuffer;

  constructor(length: r.LengthLike) {
    this.length = length;
    this.#buffer = new r.Buffer(length);
  }

  decode(stream: DecodeStream, parent?: unknown): DecodeStream {
    return new r.DecodeStream(this.#buffer.decode(stream, parent));
  }
}

// This struct represents the entire glyf table
const GlyfTable = new r.Struct<GlyfTableData>({
  version: r.uint32,
  numGlyphs: r.uint16,
  indexFormat: r.uint16,
  nContourStreamSize: r.uint32,
  nPointsStreamSize: r.uint32,
  flagStreamSize: r.uint32,
  glyphStreamSize: r.uint32,
  compositeStreamSize: r.uint32,
  bboxStreamSize: r.uint32,
  instructionStreamSize: r.uint32,
  nContours: new Substream("nContourStreamSize"),
  nPoints: new Substream("nPointsStreamSize"),
  flags: new Substream("flagStreamSize"),
  glyphs: new Substream("glyphStreamSize"),
  composites: new Substream("compositeStreamSize"),
  bboxes: new Substream("bboxStreamSize"),
  instructions: new Substream("instructionStreamSize"),
});

const WORD_CODE = 253;
const ONE_MORE_BYTE_CODE2 = 254;
const ONE_MORE_BYTE_CODE1 = 255;
const LOWEST_U_CODE = 253;

function read255UInt16(stream: DecodeStream): number {
  const code = stream.readUInt8();

  if (code === WORD_CODE) {
    return stream.readUInt16BE();
  }

  if (code === ONE_MORE_BYTE_CODE1) {
    return stream.readUInt8() + LOWEST_U_CODE;
  }

  if (code === ONE_MORE_BYTE_CODE2) {
    return stream.readUInt8() + LOWEST_U_CODE * 2;
  }

  return code;
}

function withSign(flag: number, baseval: number): number {
  return flag & 1 ? baseval : -baseval;
}

function decodeTriplet(
  flags: DecodeStream,
  glyphs: DecodeStream,
  nPoints: number,
): MutablePoint[] {
  let x = 0;
  let y = 0;
  const res: MutablePoint[] = [];

  for (let i = 0; i < nPoints; i++) {
    let dx = 0;
    let dy = 0;
    const rawFlag = flags.readUInt8();
    const onCurve = !(rawFlag >> 7);
    let flag = rawFlag & 0x7f;

    if (flag < 10) {
      dx = 0;
      dy = withSign(flag, ((flag & 14) << 7) + glyphs.readUInt8());
    } else if (flag < 20) {
      dx = withSign(flag, (((flag - 10) & 14) << 7) + glyphs.readUInt8());
      dy = 0;
    } else if (flag < 84) {
      const b0 = flag - 20;
      const b1 = glyphs.readUInt8();
      dx = withSign(flag, 1 + (b0 & 0x30) + (b1 >> 4));
      dy = withSign(flag >> 1, 1 + ((b0 & 0x0c) << 2) + (b1 & 0x0f));
    } else if (flag < 120) {
      const b0 = flag - 84;
      dx = withSign(flag, 1 + ((b0 / 12) << 8) + glyphs.readUInt8());
      dy = withSign(
        flag >> 1,
        1 + (((b0 % 12) >> 2) << 8) + glyphs.readUInt8(),
      );
    } else if (flag < 124) {
      const b1 = glyphs.readUInt8();
      const b2 = glyphs.readUInt8();
      dx = withSign(flag, (b1 << 4) + (b2 >> 4));
      dy = withSign(flag >> 1, ((b2 & 0x0f) << 8) + glyphs.readUInt8());
    } else {
      dx = withSign(flag, glyphs.readUInt16BE());
      dy = withSign(flag >> 1, glyphs.readUInt16BE());
    }

    x += dx;
    y += dy;
    res.push(new Point(onCurve, false, x, y));
  }

  return res;
}
