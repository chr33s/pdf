import type { EncodeStream } from "@chr33s/restructure";
import cloneDeep from "clone";
import TTFGlyphEncoder from "../glyph/ttf-glyph-encoder.js";
import type TTFGlyph from "../glyph/ttf-glyph.js";
import Directory from "../tables/directory.js";
import type TTFFont from "../ttf-font.js";
import Subset from "./subset.js";

type MetricRecord = { advance: number; bearing: number };
type LocaTable = { offsets: number[]; version?: number; _processed?: boolean };
type HmtxTable = { metrics: MetricRecord[]; bearings: number[] };

export default class TTFSubset extends Subset<TTFFont> {
  private readonly glyphEncoder: TTFGlyphEncoder;
  private glyf: Uint8Array[] = [];
  private offset = 0;
  private loca: LocaTable = { offsets: [] };
  private hmtx: HmtxTable = { metrics: [], bearings: [] };

  constructor(font: TTFFont) {
    super(font);
    this.glyphEncoder = new TTFGlyphEncoder();
  }

  private _addGlyph(gid: number): number {
    let glyph = this.font.getGlyph(gid) as TTFGlyph;
    let glyf = glyph._decode();

    // get the offset to the glyph from the loca table
    let curOffset = this.font.loca.offsets[gid];
    let nextOffset = this.font.loca.offsets[gid + 1];

    let stream = this.font.getTableStream("glyf");
    if (!stream) {
      throw new Error("Unable to locate glyf table stream while subsetting");
    }

    stream.pos += curOffset;

    let buffer = stream.readBuffer(nextOffset - curOffset);

    // if it is a compound glyph, include its components
    if (glyf && glyf.numberOfContours < 0) {
      buffer = new Uint8Array(buffer);
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      for (let component of glyf.components) {
        gid = this.includeGlyph(component.glyphID);
        view.setUint16(component.pos, gid, false); // big endian
      }
    } else if (glyf && this.font._variationProcessor) {
      // If this is a TrueType variation glyph, re-encode the path
      buffer = this.glyphEncoder.encodeSimple(glyph.path, glyf.instructions);
    }

    this.glyf.push(buffer);
    this.loca.offsets.push(this.offset);

    this.hmtx.metrics.push({
      advance: glyph.advanceWidth,
      bearing: glyph._getMetrics().leftBearing,
    });

    this.offset += buffer.length;
    return this.glyf.length - 1;
  }

  protected override encode(stream: EncodeStream): void {
    // tables required by PDF spec:
    //   head, hhea, loca, maxp, cvt , prep, glyf, hmtx, fpgm
    //
    // additional tables required for standalone fonts:
    //   name, cmap, OS/2, post

    this.glyf = [];
    this.offset = 0;
    this.loca = {
      offsets: [],
      version: this.font.loca.version,
    };

    this.hmtx = {
      metrics: [],
      bearings: [],
    };

    // include all the glyphs
    // not using a for loop because we need to support adding more
    // glyphs to the array as we go, and CoffeeScript caches the length.
    let i = 0;
    while (i < this.glyphs.length) {
      this._addGlyph(this.glyphs[i++]);
    }

    let maxp = cloneDeep(this.font.maxp);
    maxp.numGlyphs = this.glyf.length;

    this.loca.offsets.push(this.offset);

    let head = cloneDeep(this.font.head);
    head.indexToLocFormat = this.loca.version;

    let hhea = cloneDeep(this.font.hhea) as typeof this.font.hhea & {
      numberOfMetrics: number;
    };
    hhea.numberOfMetrics = this.hmtx.metrics.length;

    // map = []
    // for index in [0...256]
    //     if index < @numGlyphs
    //         map[index] = index
    //     else
    //         map[index] = 0
    //
    // cmapTable =
    //     version: 0
    //     length: 262
    //     language: 0
    //     codeMap: map
    //
    // cmap =
    //     version: 0
    //     numSubtables: 1
    //     tables: [
    //         platformID: 1
    //         encodingID: 0
    //         table: cmapTable
    //     ]

    // TODO: subset prep, cvt, fpgm?
    // The following is the minimum set of tables.
    let t = {
      head,
      hhea,
      loca: this.loca,
      maxp,
      "cvt ": this.font["cvt "],
      prep: this.font.prep,
      glyf: this.glyf,
      hmtx: this.hmtx,
      fpgm: this.font.fpgm,
    };

    for (const i in this.tables) {
      const table = this.tables[i];
      t[table] = cloneDeep(this.font[table]);
    }

    Directory.encode(stream, {
      tables: t,
    });
  }
}
