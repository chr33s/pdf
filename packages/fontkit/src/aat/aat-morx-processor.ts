import { cache } from "../decorators.js";
import type { FeatureSelectionMap } from "./aat-feature-map.js";
import type { LookupTable } from "./aat-lookup-table.js";
import AATLookupTable from "./aat-lookup-table.js";
import type { StateTable, StateTableEntry } from "./aat-state-machine.js";
import AATStateMachine from "./aat-state-machine.js";

// indic replacement flags
const MARK_FIRST = 0x8000;
const MARK_LAST = 0x2000;
const VERB = 0x000f;

// contextual substitution and glyph insertion flag
const SET_MARK = 0x8000;

// ligature entry flags
const SET_COMPONENT = 0x8000;
const PERFORM_ACTION = 0x2000;

// ligature action masks
const LAST_MASK = 0x80000000;
const STORE_MASK = 0x40000000;
const OFFSET_MASK = 0x3fffffff;

const _VERTICAL_ONLY = 0x800000;
const REVERSE_DIRECTION = 0x400000;
const _HORIZONTAL_AND_VERTICAL = 0x200000;

// glyph insertion flags
const _CURRENT_IS_KASHIDA_LIKE = 0x2000;
const _MARKED_IS_KASHIDA_LIKE = 0x1000;
const CURRENT_INSERT_BEFORE = 0x0800;
const MARKED_INSERT_BEFORE = 0x0400;
const CURRENT_INSERT_COUNT = 0x03e0;
const MARKED_INSERT_COUNT = 0x001f;

export type Glyph = {
  id: number;
  codePoints: number[];
};

interface GlyphFactory {
  getGlyph(id: number, codePoints?: number[]): Glyph;
}

interface LookupCollection<T = unknown> {
  getItem(index: number): T;
}

type MorxFeature = {
  featureType: number;
  featureSetting: number;
  enableFlags: number;
  disableFlags: number;
};

type MorxSubtableData = {
  stateTable: StateTable;
  substitutionTable?: {
    items: LookupCollection;
  };
  ligatureActions?: LookupCollection<number>;
  components?: LookupCollection<number>;
  ligatureList?: LookupCollection<number>;
  lookupTable?: unknown;
  insertionActions?: LookupCollection<number>;
};

type MorxSubtable = {
  subFeatureFlags: number;
  type: number;
  coverage: number;
  table: MorxSubtableData;
};

type MorxChain = {
  defaultFlags: number;
  features: MorxFeature[];
  subtables: MorxSubtable[];
};

type MorxTable = {
  chains: MorxChain[];
};

export interface FontLike extends GlyphFactory {
  morx: MorxTable;
}

type ProcessorFn = (glyph: Glyph, entry: StateTableEntry, index: number) => void;

type InputCache = Record<number, number[][]>;

export default class AATMorxProcessor {
  #font: FontLike;
  #morx: MorxTable;
  #inputCache: InputCache | null = null;
  #subtable: MorxSubtable | null = null;
  #glyphs: Glyph[] = [];
  #ligatureStack: number[] = [];
  #markedGlyph: number | null = null;
  #firstGlyph: number | null = null;
  #lastGlyph: number | null = null;
  #markedIndex: number | null = null;

  constructor(font: FontLike) {
    this.#font = font;
    this.#morx = font.morx;
  }

  #getGlyph(gid: number, codePoints?: number[]): Glyph {
    if (gid === 0xffff) {
      return { id: 0xffff, codePoints: [] };
    }

    return this.#font.getGlyph(gid, codePoints);
  }

  // Processes an array of glyphs and applies the specified features
  // Features should be in the form of {featureType:{featureSetting:boolean}}
  process(glyphs: Glyph[], features: FeatureSelectionMap = {} as FeatureSelectionMap) {
    for (const chain of this.#morx.chains) {
      let flags = chain.defaultFlags;

      // enable/disable the requested features
      for (const feature of chain.features) {
        const requested = features[feature.featureType];
        if (requested) {
          if (requested[feature.featureSetting]) {
            flags &= feature.disableFlags;
            flags |= feature.enableFlags;
          } else if (requested[feature.featureSetting] === false) {
            flags |= ~feature.disableFlags;
            flags &= ~feature.enableFlags;
          }
        }
      }

      for (const subtable of chain.subtables) {
        if (subtable.subFeatureFlags & flags) {
          this.processSubtable(subtable, glyphs);
        }
      }
    }

    // remove deleted glyphs
    let index = glyphs.length - 1;
    while (index >= 0) {
      if (glyphs[index].id === 0xffff) {
        glyphs.splice(index, 1);
      }

      index--;
    }

    return glyphs;
  }

  processSubtable(subtable: MorxSubtable, glyphs: Glyph[]) {
    this.#subtable = subtable;
    this.#glyphs = glyphs;
    if (subtable.type === 4) {
      this.processNoncontextualSubstitutions(subtable, glyphs);
      return;
    }

    this.#ligatureStack = [];
    this.#markedGlyph = null;
    this.#firstGlyph = null;
    this.#lastGlyph = null;
    this.#markedIndex = null;

    const stateMachine = this.getStateMachine(subtable);
    const process = this.getProcessor();

    const reverse = !!(subtable.coverage & REVERSE_DIRECTION);
    return stateMachine.process(this.#glyphs, reverse, process);
  }

  @cache
  getStateMachine(subtable: MorxSubtable) {
    return new AATStateMachine(subtable.table.stateTable);
  }

  getProcessor(): ProcessorFn {
    const subtable = this.#subtable;
    if (!subtable) {
      throw new Error("Processor accessed without an active subtable");
    }

    switch (subtable.type) {
      case 0:
        return this.processIndicRearragement;
      case 1:
        return this.processContextualSubstitution;
      case 2:
        return this.processLigature;
      case 4:
        return () => undefined;
      case 5:
        return this.processGlyphInsertion;
      default:
        throw new Error(`Invalid morx subtable type: ${subtable.type}`);
    }
  }

  processIndicRearragement: ProcessorFn = (_glyph, entry, index) => {
    if (entry.flags & MARK_FIRST) {
      this.#firstGlyph = index;
    }

    if (entry.flags & MARK_LAST) {
      this.#lastGlyph = index;
    }

    reorderGlyphs(this.#glyphs, entry.flags & VERB, this.#firstGlyph, this.#lastGlyph);
  };

  processContextualSubstitution: ProcessorFn = (_glyph, entry, index) => {
    const subtable = this.#subtable;
    const substitutions = subtable?.table.substitutionTable?.items;
    if (!substitutions) {
      throw new Error("Substitution table missing for contextual processor");
    }

    if (entry.markIndex !== 0xffff && this.#markedGlyph != null) {
      const lookup = substitutions.getItem(entry.markIndex) as LookupTable;
      const lookupTable = new AATLookupTable(lookup);
      const glyph = this.#glyphs[this.#markedGlyph];
      const gid = lookupTable.lookup(glyph.id);
      if (gid) {
        this.#glyphs[this.#markedGlyph] = this.#getGlyph(gid, glyph.codePoints);
      }
    }

    if (entry.currentIndex !== 0xffff) {
      const lookup = substitutions.getItem(entry.currentIndex) as LookupTable;
      const lookupTable = new AATLookupTable(lookup);
      const glyph = this.#glyphs[index];
      const gid = lookupTable.lookup(glyph.id);
      if (gid) {
        this.#glyphs[index] = this.#getGlyph(gid, glyph.codePoints);
      }
    }

    if (entry.flags & SET_MARK) {
      this.#markedGlyph = index;
    }
  };

  processLigature: ProcessorFn = (_glyph, entry, _index) => {
    if (entry.flags & SET_COMPONENT) {
      this.#ligatureStack.push(_index);
    }

    if (entry.flags & PERFORM_ACTION) {
      const subtable = this.#subtable;
      const { ligatureActions, components, ligatureList } = subtable?.table ?? {};
      if (!ligatureActions || !components || !ligatureList) {
        throw new Error("Ligature table missing required data");
      }

      let actionIndex = entry.action;
      let last = false;
      let ligatureIndex = 0;
      let codePoints: number[] = [];
      const ligatureGlyphs: number[] = [];

      while (!last) {
        const componentGlyph = this.#ligatureStack.pop();
        if (componentGlyph == null) {
          break;
        }

        codePoints.unshift(...this.#glyphs[componentGlyph].codePoints);

        const action = ligatureActions.getItem(actionIndex++);
        last = !!(action & LAST_MASK);
        const store = !!(action & STORE_MASK);
        let offset = ((action & OFFSET_MASK) << 2) >> 2; // sign extend 30 to 32 bits
        offset += this.#glyphs[componentGlyph].id;

        const component = components.getItem(offset);
        ligatureIndex += component;

        if (last || store) {
          const ligatureEntry = ligatureList.getItem(ligatureIndex);
          this.#glyphs[componentGlyph] = this.#getGlyph(ligatureEntry, codePoints);
          ligatureGlyphs.push(componentGlyph);
          ligatureIndex = 0;
          codePoints = [];
        } else {
          this.#glyphs[componentGlyph] = this.#getGlyph(0xffff);
        }
      }

      this.#ligatureStack.push(...ligatureGlyphs);
    }
  };

  processNoncontextualSubstitutions = (subtable: MorxSubtable, glyphs: Glyph[]) => {
    const lookupSource = subtable.table.lookupTable as LookupTable | undefined;
    if (!lookupSource) {
      throw new Error("Lookup table missing for noncontextual substitution");
    }

    const lookupTable = new AATLookupTable(lookupSource);

    for (let index = 0; index < glyphs.length; index++) {
      const glyph = glyphs[index];
      if (glyph.id !== 0xffff) {
        const gid = lookupTable.lookup(glyph.id);
        if (gid) {
          glyphs[index] = this.#getGlyph(gid, glyph.codePoints);
        }
      }
    }
  };

  #insertGlyphs(
    glyphIndex: number,
    insertionActionIndex: number,
    count: number,
    isBefore: boolean,
  ) {
    const subtable = this.#subtable;
    const insertionActions = subtable?.table.insertionActions;
    if (!insertionActions) {
      throw new Error("Insertion actions missing for glyph insertion");
    }

    const insertions: Glyph[] = [];
    let remaining = count;
    while (remaining--) {
      const gid = insertionActions.getItem(insertionActionIndex++);
      insertions.push(this.#getGlyph(gid));
    }

    if (!isBefore) {
      glyphIndex++;
    }

    this.#glyphs.splice(glyphIndex, 0, ...insertions);
  }

  processGlyphInsertion: ProcessorFn = (_glyph, entry, index) => {
    if (entry.flags & SET_MARK) {
      this.#markedIndex = index;
    }

    if (entry.markedInsertIndex !== 0xffff && this.#markedIndex != null) {
      const count = (entry.flags & MARKED_INSERT_COUNT) >>> 5;
      const isBefore = !!(entry.flags & MARKED_INSERT_BEFORE);
      this.#insertGlyphs(this.#markedIndex, entry.markedInsertIndex, count, isBefore);
    }

    if (entry.currentInsertIndex !== 0xffff) {
      const count = (entry.flags & CURRENT_INSERT_COUNT) >>> 5;
      const isBefore = !!(entry.flags & CURRENT_INSERT_BEFORE);
      this.#insertGlyphs(index, entry.currentInsertIndex, count, isBefore);
    }
  };

  getSupportedFeatures() {
    const features: Array<[number, number]> = [];
    for (const chain of this.#morx.chains) {
      for (const feature of chain.features) {
        features.push([feature.featureType, feature.featureSetting]);
      }
    }

    return features;
  }

  generateInputs(gid: number) {
    if (!this.#inputCache) {
      this.generateInputCache();
    }

    return (this.#inputCache && this.#inputCache[gid]) || [];
  }

  generateInputCache() {
    this.#inputCache = {};

    for (const chain of this.#morx.chains) {
      let flags = chain.defaultFlags;

      for (const subtable of chain.subtables) {
        if (subtable.subFeatureFlags & flags) {
          this.generateInputsForSubtable(subtable);
        }
      }
    }
  }

  generateInputsForSubtable(subtable: MorxSubtable) {
    // Currently, only supporting ligature subtables.
    if (subtable.type !== 2) {
      return;
    }

    const reverse = !!(subtable.coverage & REVERSE_DIRECTION);
    if (reverse) {
      throw new Error("Reverse subtable, not supported.");
    }

    this.#subtable = subtable;
    this.#ligatureStack = [];

    const stateMachine = this.getStateMachine(subtable);
    const process = this.getProcessor();

    const input: Glyph[] = [];
    const stack: Array<{ glyphs: Glyph[]; ligatureStack: number[] }> = [];
    this.#glyphs = [];

    stateMachine.traverse({
      enter: (glyph: number, entry: StateTableEntry) => {
        const glyphs = this.#glyphs;
        stack.push({
          glyphs: glyphs.slice(),
          ligatureStack: this.#ligatureStack.slice(),
        });

        // Add glyph to input and glyphs to process.
        const g = this.#getGlyph(glyph);
        input.push(g);
        glyphs.push(input[input.length - 1]);

        // Process ligature substitution
        process(glyphs[glyphs.length - 1], entry, glyphs.length - 1);

        // Add input to result if only one matching (non-deleted) glyph remains.
        let count = 0;
        let found = 0;
        for (let i = 0; i < glyphs.length && count <= 1; i++) {
          if (glyphs[i].id !== 0xffff) {
            count++;
            found = glyphs[i].id;
          }
        }

        if (count === 1) {
          const result = input.map((g) => g.id);
          if (!this.#inputCache) {
            this.#inputCache = {};
          }
          const cache = this.#inputCache[found];
          if (cache) {
            cache.push(result);
          } else {
            this.#inputCache[found] = [result];
          }
        }
      },

      exit: () => {
        const previous = stack.pop();
        if (!previous) {
          return;
        }

        this.#glyphs = previous.glyphs;
        this.#ligatureStack = previous.ligatureStack;
        input.pop();
      },
    });
  }
}

// swaps the glyphs in rangeA with those in rangeB
// reverse the glyphs inside those ranges if specified
// ranges are in [offset, length] format
function swap(
  glyphs: Glyph[],
  rangeA: [number, number],
  rangeB: [number, number],
  reverseA = false,
  reverseB = false,
) {
  let end = glyphs.splice(rangeB[0] - (rangeB[1] - 1), rangeB[1]);
  if (reverseB) {
    end.reverse();
  }

  let start = glyphs.splice(rangeA[0], rangeA[1], ...end);
  if (reverseA) {
    start.reverse();
  }

  glyphs.splice(rangeB[0] - (rangeA[1] - 1), 0, ...start);
  return glyphs;
}

function reorderGlyphs(
  glyphs: Glyph[],
  verb: number,
  firstGlyph: number | null,
  lastGlyph: number | null,
) {
  if (firstGlyph == null || lastGlyph == null) {
    return glyphs;
  }

  switch (verb) {
    case 0: // no change
      return glyphs;

    case 1: // Ax => xA
      return swap(glyphs, [firstGlyph, 1], [lastGlyph, 0]);

    case 2: // xD => Dx
      return swap(glyphs, [firstGlyph, 0], [lastGlyph, 1]);

    case 3: // AxD => DxA
      return swap(glyphs, [firstGlyph, 1], [lastGlyph, 1]);

    case 4: // ABx => xAB
      return swap(glyphs, [firstGlyph, 2], [lastGlyph, 0]);

    case 5: // ABx => xBA
      return swap(glyphs, [firstGlyph, 2], [lastGlyph, 0], true, false);

    case 6: // xCD => CDx
      return swap(glyphs, [firstGlyph, 0], [lastGlyph, 2]);

    case 7: // xCD => DCx
      return swap(glyphs, [firstGlyph, 0], [lastGlyph, 2], false, true);

    case 8: // AxCD => CDxA
      return swap(glyphs, [firstGlyph, 1], [lastGlyph, 2]);

    case 9: // AxCD => DCxA
      return swap(glyphs, [firstGlyph, 1], [lastGlyph, 2], false, true);

    case 10: // ABxD => DxAB
      return swap(glyphs, [firstGlyph, 2], [lastGlyph, 1]);

    case 11: // ABxD => DxBA
      return swap(glyphs, [firstGlyph, 2], [lastGlyph, 1], true, false);

    case 12: // ABxCD => CDxAB
      return swap(glyphs, [firstGlyph, 2], [lastGlyph, 2]);

    case 13: // ABxCD => CDxBA
      return swap(glyphs, [firstGlyph, 2], [lastGlyph, 2], true, false);

    case 14: // ABxCD => DCxAB
      return swap(glyphs, [firstGlyph, 2], [lastGlyph, 2], false, true);

    case 15: // ABxCD => DCxBA
      return swap(glyphs, [firstGlyph, 2], [lastGlyph, 2], true, true);

    default:
      throw new Error(`Unknown verb: ${verb}`);
  }
}
