import { cache } from "./decorators.js";
import { getEncoding } from "./encodings.js";
import { binarySearch, range } from "./utils.js";

import iconv from "iconv-lite";

type LazyArrayLike<T> = {
  get(index: number): T;
  length: number;
  toArray(): T[];
};

type CmapGroupRecord = {
  startCharCode: number;
  endCharCode: number;
  glyphID: number;
};

interface BaseCmapSubtable {
  version: number;
  language?: number;
}

interface CmapFormat0Subtable extends BaseCmapSubtable {
  version: 0;
  codeMap: LazyArrayLike<number>;
}

interface CmapFormat4Subtable extends BaseCmapSubtable {
  version: 4;
  segCount: number;
  startCode: LazyArrayLike<number>;
  endCode: LazyArrayLike<number>;
  idDelta: LazyArrayLike<number>;
  idRangeOffset: LazyArrayLike<number>;
  glyphIndexArray: LazyArrayLike<number | undefined>;
}

interface CmapFormat6Subtable extends BaseCmapSubtable {
  version: 6;
  firstCode: number;
  glyphIndices: LazyArrayLike<number | undefined>;
}

interface CmapFormat8Subtable extends BaseCmapSubtable {
  version: 8;
}

interface CmapFormat10Subtable extends BaseCmapSubtable {
  version: 10;
  firstCode: number;
  glyphIndices: LazyArrayLike<number | undefined>;
}

interface CmapFormat12Subtable extends BaseCmapSubtable {
  version: 12;
  nGroups: number;
  groups: LazyArrayLike<CmapGroupRecord>;
}

interface CmapFormat13Subtable extends BaseCmapSubtable {
  version: 13;
  nGroups: number;
  groups: LazyArrayLike<CmapGroupRecord>;
}

type UnicodeValueRange = {
  startUnicodeValue: number;
  additionalCount: number;
};

type UVSMapping = {
  unicodeValue: number;
  glyphID: number;
};

type MaybeLazyArray<T> = LazyArrayLike<T> | T[];

type VariationSelectorRecord = {
  varSelector: number;
  defaultUVS?: MaybeLazyArray<UnicodeValueRange> | null;
  nonDefaultUVS?: MaybeLazyArray<UVSMapping> | null;
};

interface CmapFormat14Subtable extends BaseCmapSubtable {
  version: 14;
  varSelectors: LazyArrayLike<VariationSelectorRecord>;
}

type PrimaryCmapSubtable =
  | CmapFormat0Subtable
  | CmapFormat4Subtable
  | CmapFormat6Subtable
  | CmapFormat8Subtable
  | CmapFormat10Subtable
  | CmapFormat12Subtable
  | CmapFormat13Subtable;

type AnyCmapSubtable = PrimaryCmapSubtable | CmapFormat14Subtable;

type CmapTableEntry = {
  platformID: number;
  encodingID: number;
  table: AnyCmapSubtable | null;
};

type CmapTable = {
  tables: CmapTableEntry[];
};

function materialize<T>(value?: MaybeLazyArray<T> | null): T[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return value.toArray();
}

function isVariationSelectorTable(table: AnyCmapSubtable | null): table is CmapFormat14Subtable {
  return table?.version === 14;
}

export default class CmapProcessor {
  #cmap!: PrimaryCmapSubtable;
  #encoding: string | null;
  #uvs: CmapFormat14Subtable | null;

  constructor(cmapTable: CmapTable) {
    this.#encoding = null;
    const unicodeCmap = this.#findPrimarySubtable(cmapTable, [
      // 32-bit subtables
      [3, 10],
      [0, 6],
      [0, 4],

      // 16-bit subtables
      [3, 1],
      [0, 3],
      [0, 2],
      [0, 1],
      [0, 0],
    ]);

    if (unicodeCmap) {
      this.#cmap = unicodeCmap;
    }

    // If no unicode cmap was found, and iconv-lite is installed,
    // take the first table with a supported encoding.
    if (!this.#cmap && iconv) {
      for (const cmap of cmapTable.tables) {
        if (!cmap.table) {
          continue;
        }

        const encoding = getEncoding(
          cmap.platformID,
          cmap.encodingID,
          (cmap.table.language ?? 0) - 1,
        );

        if (encoding && iconv.encodingExists(encoding)) {
          this.#cmap = cmap.table as PrimaryCmapSubtable;
          this.#encoding = encoding;
          break;
        }
      }
    }

    if (!this.#cmap) {
      throw new Error("Could not find a supported cmap table");
    }

    const variationTable = this.#findSubtable(cmapTable, [[0, 5]]);
    this.#uvs = isVariationSelectorTable(variationTable) ? variationTable : null;
  }

  #findPrimarySubtable(
    cmapTable: CmapTable,
    pairs: readonly [number, number][],
  ): PrimaryCmapSubtable | null {
    const subtable = this.#findSubtable(cmapTable, pairs);
    if (subtable && !isVariationSelectorTable(subtable)) {
      return subtable;
    }

    return null;
  }

  #findSubtable(cmapTable: CmapTable, pairs: readonly [number, number][]): AnyCmapSubtable | null {
    for (const [platformID, encodingID] of pairs) {
      for (const cmap of cmapTable.tables) {
        if (cmap.platformID === platformID && cmap.encodingID === encodingID) {
          const table = cmap.table;
          if (!table) {
            console.warn("cmap subtable is null", platformID, encodingID, cmap);
            continue;
          }

          return table;
        }
      }
    }

    return null;
  }

  lookup(codepoint: number, variationSelector?: number): number {
    // If there is no Unicode cmap in this font, we need to re-encode
    // the codepoint in the encoding that the cmap supports.
    if (this.#encoding) {
      const buf = iconv.encode(String.fromCodePoint(codepoint), this.#encoding);
      codepoint = 0;
      for (let i = 0; i < buf.length; i++) {
        codepoint = (codepoint << 8) | buf[i];
      }

      // Otherwise, try to get a Unicode variation selector for this codepoint if one is provided.
    } else if (variationSelector) {
      const gid = this.getVariationSelector(codepoint, variationSelector);
      if (gid) {
        return gid;
      }
    }

    const cmap = this.#cmap;
    const version = cmap.version;
    switch (version) {
      case 0:
        return cmap.codeMap.get(codepoint) || 0;

      case 4: {
        let min = 0;
        let max = cmap.segCount - 1;
        while (min <= max) {
          let mid = (min + max) >> 1;

          if (codepoint < cmap.startCode.get(mid)) {
            max = mid - 1;
          } else if (codepoint > cmap.endCode.get(mid)) {
            min = mid + 1;
          } else {
            const rangeOffset = cmap.idRangeOffset.get(mid);
            let gid;

            if (rangeOffset === 0) {
              gid = codepoint + cmap.idDelta.get(mid);
            } else {
              const index =
                rangeOffset / 2 + (codepoint - cmap.startCode.get(mid)) - (cmap.segCount - mid);
              gid = cmap.glyphIndexArray.get(index) || 0;
              if (gid !== 0) {
                gid += cmap.idDelta.get(mid);
              }
            }

            return gid & 0xffff;
          }
        }

        return 0;
      }

      case 8:
        throw new Error("TODO: cmap format 8");

      case 6:
      case 10:
        return cmap.glyphIndices.get(codepoint - cmap.firstCode) || 0;

      case 12:
      case 13: {
        let min = 0;
        let max = cmap.nGroups - 1;
        while (min <= max) {
          let mid = (min + max) >> 1;
          const group = cmap.groups.get(mid);

          if (codepoint < group.startCharCode) {
            max = mid - 1;
          } else if (codepoint > group.endCharCode) {
            min = mid + 1;
          } else {
            if (cmap.version === 12) {
              return group.glyphID + (codepoint - group.startCharCode);
            } else {
              return group.glyphID;
            }
          }
        }

        return 0;
      }

      default:
        throw new Error(`Unknown cmap format ${String(version)}`);
    }
  }

  getVariationSelector(codepoint: number, variationSelector: number): number {
    if (!this.#uvs) {
      return 0;
    }

    const selectors = this.#uvs.varSelectors.toArray();
    const selectorIndex = binarySearch(
      selectors,
      (record: VariationSelectorRecord) => variationSelector - record.varSelector,
    );

    if (selectorIndex === -1) {
      return 0;
    }

    const sel = selectors[selectorIndex];
    let matchIndex = selectorIndex;

    if (sel.defaultUVS) {
      const defaultRecords = materialize(sel.defaultUVS);
      matchIndex = binarySearch(defaultRecords, (record: UnicodeValueRange) =>
        codepoint < record.startUnicodeValue
          ? -1
          : codepoint > record.startUnicodeValue + record.additionalCount
            ? +1
            : 0,
      );
    }

    if (matchIndex !== -1 && sel.nonDefaultUVS) {
      const nonDefaultRecords = materialize(sel.nonDefaultUVS);
      const nonDefaultIndex = binarySearch(
        nonDefaultRecords,
        (record: UVSMapping) => codepoint - record.unicodeValue,
      );

      if (nonDefaultIndex !== -1) {
        return nonDefaultRecords[nonDefaultIndex].glyphID;
      }
    }

    return 0;
  }

  @cache
  getCharacterSet(): number[] {
    const cmap = this.#cmap;
    const version = cmap.version;
    switch (version) {
      case 0:
        return range(0, cmap.codeMap.length);

      case 4: {
        let res: number[] = [];
        const endCodes = cmap.endCode.toArray();
        for (let i = 0; i < endCodes.length; i++) {
          const tail = endCodes[i] + 1;
          const start = cmap.startCode.get(i);
          res.push(...range(start, tail));
        }

        return res;
      }

      case 8:
        throw new Error("TODO: cmap format 8");

      case 6:
      case 10:
        return range(cmap.firstCode, cmap.firstCode + cmap.glyphIndices.length);

      case 12:
      case 13: {
        let res: number[] = [];
        for (const group of cmap.groups.toArray()) {
          res.push(...range(group.startCharCode, group.endCharCode + 1));
        }

        return res;
      }

      default:
        throw new Error(`Unknown cmap format ${String(version)}`);
    }
  }

  @cache
  codePointsForGlyph(gid: number): number[] {
    const cmap = this.#cmap;
    const version = cmap.version;
    switch (version) {
      case 0: {
        let res: number[] = [];
        for (let i = 0; i < 256; i++) {
          if (cmap.codeMap.get(i) === gid) {
            res.push(i);
          }
        }

        return res;
      }

      case 4: {
        let res: number[] = [];
        for (let i = 0; i < cmap.segCount; i++) {
          const end = cmap.endCode.get(i);
          const start = cmap.startCode.get(i);
          const rangeOffset = cmap.idRangeOffset.get(i);
          const delta = cmap.idDelta.get(i);

          for (let c = start; c <= end; c++) {
            let g = 0;
            if (rangeOffset === 0) {
              g = c + delta;
            } else {
              const index = rangeOffset / 2 + (c - start) - (cmap.segCount - i);
              g = cmap.glyphIndexArray.get(index) || 0;
              if (g !== 0) {
                g += delta;
              }
            }

            if (g === gid) {
              res.push(c);
            }
          }
        }

        return res;
      }

      case 12: {
        let res: number[] = [];
        for (const group of cmap.groups.toArray()) {
          if (
            gid >= group.glyphID &&
            gid <= group.glyphID + (group.endCharCode - group.startCharCode)
          ) {
            res.push(group.startCharCode + (gid - group.glyphID));
          }
        }

        return res;
      }

      case 13: {
        let res: number[] = [];
        for (const group of cmap.groups.toArray()) {
          if (gid === group.glyphID) {
            res.push(...range(group.startCharCode, group.endCharCode + 1));
          }
        }

        return res;
      }

      default:
        throw new Error(`Unknown cmap format ${version}`);
    }
  }
}
