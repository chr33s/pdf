import { EncodeStream } from "@chr33s/restructure";
import cloneDeep from "clone";
import CFFTop from "../cff/./cff-top.js";
import type CFFFont from "../cff/cff-font.js";
import standardStrings from "../cff/cff-standard-strings.js";
import type CFFGlyph from "../glyph/cff-glyph.js";
import type { FontLike } from "../glyph/glyph.js";
import Directory from "../tables/directory.js";
import Subset from "./subset.js";

type SubroutineRecord = { offset: number; length: number };
type SubroutineList = Array<SubroutineRecord | undefined>;
type UsageMap = Record<number, boolean>;

export default class CFFSubset extends Subset {
  private readonly cff: CFFFont;
  private charstrings: Buffer[] = [];
  private gsubrs: Buffer[] = [];
  private strings?: string[];

  constructor(font: FontLike) {
    super(font);

    const cff = this.font["CFF "] as CFFFont | undefined;
    if (!cff) {
      throw new Error("Not a CFF Font");
    }

    this.cff = cff;
  }

  subsetCharstrings(): void {
    this.charstrings = [];
    const gsubrs: UsageMap = {};

    for (let gid of this.glyphs) {
      this.charstrings.push(this.cff.getCharString(gid));

      let glyph = this.font.getGlyph(gid) as CFFGlyph;
      void glyph.path; // triggers glyph parsing

      for (let subr in glyph._usedGsubrs) {
        gsubrs[Number(subr)] = true;
      }
    }

    this.gsubrs = this.subsetSubrs(this.cff.globalSubrIndex, gsubrs);
  }

  subsetSubrs(subrs: SubroutineList, used: UsageMap): Buffer[] {
    const res: Buffer[] = [];
    for (let i = 0; i < subrs.length; i++) {
      let subr = subrs[i];
      if (subr && used[i]) {
        this.cff.stream.pos = subr.offset;
        res.push(this.cff.stream.readBuffer(subr.length));
      } else {
        res.push(Buffer.from([11])); // return
      }
    }

    return res;
  }

  subsetFontdict(topDict: Record<string, any>): void {
    topDict.FDArray = [];
    topDict.FDSelect = {
      version: 0,
      fds: [] as number[],
    };

    const fdMap: Record<number, number> = {};
    const usedSubrs: UsageMap[] = [];
    for (let gid of this.glyphs) {
      const fd = this.cff.fdForGlyph(gid);
      if (fd == null) {
        continue;
      }

      if (fdMap[fd] == null) {
        fdMap[fd] = topDict.FDArray.length;
        topDict.FDArray.push(Object.assign({}, this.cff.topDict.FDArray[fd]));
        usedSubrs[fdMap[fd]] = {};
      }

      const mappedIndex = fdMap[fd];
      topDict.FDSelect.fds.push(mappedIndex);

      let glyph = this.font.getGlyph(gid) as CFFGlyph;
      void glyph.path; // triggers glyph parsing
      for (let subr in glyph._usedSubrs) {
        usedSubrs[mappedIndex][Number(subr)] = true;
      }
    }

    for (let i = 0; i < topDict.FDArray.length; i++) {
      let dict = topDict.FDArray[i];
      delete dict.FontName;
      if (dict.Private && dict.Private.Subrs) {
        dict.Private = Object.assign({}, dict.Private);
        dict.Private.Subrs = this.subsetSubrs(
          dict.Private.Subrs,
          usedSubrs[i] ?? {},
        );
      }
    }
  }

  createCIDFontdict(topDict: Record<string, any>) {
    let used_subrs: UsageMap = {};
    for (let gid of this.glyphs) {
      let glyph = this.font.getGlyph(gid) as CFFGlyph;
      void glyph.path; // triggers glyph parsing

      for (let subr in glyph._usedSubrs) {
        used_subrs[Number(subr)] = true;
      }
    }

    let privateDict = Object.assign({}, this.cff.topDict.Private);
    if (this.cff.topDict.Private && this.cff.topDict.Private.Subrs) {
      privateDict.Subrs = this.subsetSubrs(
        this.cff.topDict.Private.Subrs,
        used_subrs,
      );
    }

    topDict.FDArray = [{ Private: privateDict }];
    return (topDict.FDSelect = {
      version: 3,
      nRanges: 1,
      ranges: [{ first: 0, fd: 0 }],
      sentinel: this.charstrings.length,
    });
  }

  addString(value: string | null): number | null {
    if (!value) {
      return null;
    }

    if (!this.strings) {
      this.strings = [];
    }

    this.strings.push(value);
    return standardStrings.length + this.strings.length - 1;
  }

  protected override encode(stream: EncodeStream): void {
    this.subsetCharstrings();

    let glyphMetrics = [] as { advance: number; bearing: number }[];
    for (let gid of this.glyphs) {
      let glyph = this.font.getGlyph(gid) as CFFGlyph;
      let metrics = glyph._getMetrics();
      glyphMetrics.push({
        advance: metrics.advanceWidth,
        bearing: metrics.leftBearing,
      });
    }

    let hmtx = {
      metrics: glyphMetrics,
      bearings: [] as number[],
    };

    let maxp = cloneDeep(this.font.maxp);
    maxp.numGlyphs = this.charstrings.length;

    let head = cloneDeep(this.font.head);
    let hhea = cloneDeep(this.font.hhea) as typeof this.font.hhea & {
      numberOfMetrics: number;
    };
    hhea.numberOfMetrics = hmtx.metrics.length;

    const charset = this.buildCharset();
    const topDict = this.buildTopDict(charset);
    const cffTable = this.buildCFFBuffer(topDict);

    Directory.encode(stream, {
      tag: "OTTO",
      tables: {
        head,
        hhea,
        maxp,
        hmtx,
        "CFF ": cffTable,
      },
    });
  }

  private buildCharset() {
    if (this.charstrings.length <= 1) {
      return {
        version: 0,
        glyphs: [],
      };
    }

    return {
      version: this.charstrings.length > 255 ? 2 : 1,
      ranges: [{ first: 1, nLeft: this.charstrings.length - 2 }],
    };
  }

  private buildTopDict(charset: Record<string, unknown>) {
    let topDict = Object.assign({}, this.cff.topDict);
    topDict.Private = null;
    topDict.charset = charset;
    topDict.Encoding = null;
    topDict.CharStrings = this.charstrings;

    for (let key of [
      "version",
      "Notice",
      "Copyright",
      "FullName",
      "FamilyName",
      "Weight",
      "PostScript",
      "BaseFontName",
      "FontName",
    ]) {
      topDict[key] = this.addString(this.cff.string(topDict[key]));
    }

    topDict.ROS = [this.addString("Adobe"), this.addString("Identity"), 0];
    topDict.CIDCount = this.charstrings.length;

    if (this.cff.isCIDFont) {
      this.subsetFontdict(topDict);
    } else {
      this.createCIDFontdict(topDict);
    }

    return topDict;
  }

  private buildCFFBuffer(topDict: Record<string, unknown>) {
    const cffRecord = this.cff as Record<string, any>;
    let offSize = cffRecord.offSize;
    if (offSize == null) {
      const header = cffRecord.header as { offSize?: number } | undefined;
      offSize = header?.offSize ?? 4;
    }

    const top = {
      version: 1,
      hdrSize: this.cff.hdrSize,
      offSize,
      header: this.cff.header,
      nameIndex: [this.cff.postscriptName],
      topDictIndex: [topDict],
      stringIndex: this.strings,
      globalSubrIndex: this.gsubrs,
    };

    const cffStream = new EncodeStream();
    CFFTop.encode(cffStream, top);
    cffStream.end();
    return cffStream.toBuffer();
  }
}
