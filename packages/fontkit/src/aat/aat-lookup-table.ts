import { cache } from "../decorators.js";
import { range } from "../utils.js";

type SimpleLookupTable = {
  version: 0;
  values: {
    getItem(index: number): number | null;
  };
};

type BinarySearchHeader = {
  nUnits: number;
};

type SegmentRange = {
  firstGlyph: number;
  lastGlyph: number;
};

type SegmentValue = SegmentRange & {
  value: number;
};

type SegmentValues = SegmentRange & {
  values: number[];
};

type SegmentGlyph = {
  glyph: number;
  value: number;
};

type SegmentLookupTableV2 = {
  version: 2;
  binarySearchHeader: BinarySearchHeader;
  segments: SegmentValue[];
};

type SegmentLookupTableV4 = {
  version: 4;
  binarySearchHeader: BinarySearchHeader;
  segments: SegmentValues[];
};

type SingleLookupTable = {
  version: 6;
  binarySearchHeader: BinarySearchHeader;
  segments: SegmentGlyph[];
};

type TrimmedLookupTable = {
  version: 8;
  firstGlyph: number;
  values: number[];
};

export type LookupTable =
  | SimpleLookupTable
  | SegmentLookupTableV2
  | SegmentLookupTableV4
  | SingleLookupTable
  | TrimmedLookupTable;

export default class AATLookupTable {
  #table: LookupTable;

  constructor(table: LookupTable) {
    this.#table = table;
  }

  lookup(glyph: number): number | null {
    const version = this.#table.version;
    switch (version) {
      case 0: // simple array format
        return this.#table.values.getItem(glyph);

      case 2: {
        let min = 0;
        let max = this.#table.binarySearchHeader.nUnits - 1;
        const table = this.#table as SegmentLookupTableV2;

        while (min <= max) {
          const mid = (min + max) >> 1;
          const segment = table.segments[mid];

          if (segment.firstGlyph === 0xffff) {
            return null;
          }

          if (glyph < segment.firstGlyph) {
            max = mid - 1;
          } else if (glyph > segment.lastGlyph) {
            min = mid + 1;
          } else {
            return segment.value;
          }
        }

        return null;
      }

      case 4: {
        let min = 0;
        let max = this.#table.binarySearchHeader.nUnits - 1;
        const table = this.#table as SegmentLookupTableV4;

        while (min <= max) {
          const mid = (min + max) >> 1;
          const segment = table.segments[mid];

          if (segment.firstGlyph === 0xffff) {
            return null;
          }

          if (glyph < segment.firstGlyph) {
            max = mid - 1;
          } else if (glyph > segment.lastGlyph) {
            min = mid + 1;
          } else {
            return segment.values[glyph - segment.firstGlyph];
          }
        }

        return null;
      }

      case 6: {
        // lookup single
        let min = 0;
        let max = this.#table.binarySearchHeader.nUnits - 1;
        const table = this.#table as SingleLookupTable;

        while (min <= max) {
          const mid = (min + max) >> 1;
          const segment = table.segments[mid];

          // special end of search value
          if (segment.glyph === 0xffff) {
            return null;
          }

          if (glyph < segment.glyph) {
            max = mid - 1;
          } else if (glyph > segment.glyph) {
            min = mid + 1;
          } else {
            return segment.value;
          }
        }

        return null;
      }

      case 8: {
        // lookup trimmed
        const table = this.#table as TrimmedLookupTable;
        return table.values[glyph - table.firstGlyph];
      }

      default:
        throw new Error(`Unknown lookup table format: ${String(version)}`);
    }
  }

  @cache
  glyphsForValue(classValue: number): number[] {
    let res: number[] = [];

    const version = this.#table.version;
    switch (version) {
      case 2: {
        const table = this.#table as SegmentLookupTableV2;
        for (const segment of table.segments) {
          if (segment.value === classValue) {
            res.push(...range(segment.firstGlyph, segment.lastGlyph + 1));
          }
        }

        break;
      }

      case 4: {
        const table = this.#table as SegmentLookupTableV4;
        for (const segment of table.segments) {
          const values = segment.values;
          for (let index = 0; index < values.length; index++) {
            if (values[index] === classValue) {
              res.push(segment.firstGlyph + index);
            }
          }
        }

        break;
      }

      case 6: {
        // lookup single
        const table = this.#table as SingleLookupTable;
        for (const segment of table.segments) {
          if (segment.value === classValue) {
            res.push(segment.glyph);
          }
        }

        break;
      }

      case 8: {
        // lookup trimmed
        const table = this.#table as TrimmedLookupTable;
        for (let i = 0; i < table.values.length; i++) {
          if (table.values[i] === classValue) {
            res.push(table.firstGlyph + i);
          }
        }

        break;
      }

      default:
        throw new Error(`Unknown lookup table format: ${String(version)}`);
    }

    return res;
  }
}
