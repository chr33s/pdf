import type { LookupTable } from "./aat-lookup-table.js";
import AATLookupTable from "./aat-lookup-table.js";
import type { Glyph } from "./aat-morx-processor.js";

const START_OF_TEXT_STATE = 0;
const _START_OF_LINE_STATE = 1;

const END_OF_TEXT_CLASS = 0;
const OUT_OF_BOUNDS_CLASS = 1;
const DELETED_GLYPH_CLASS = 2;
const _END_OF_LINE_CLASS = 3;

const DONT_ADVANCE = 0x4000;

export type StateArray = {
  getItem(index: number): number[];
};

export type StateTableEntry = {
  flags: number;
  newState: number;
  markIndex: number;
  currentIndex: number;
  action: number;
  markedInsertIndex: number;
  currentInsertIndex: number;
};

type EntryTable = {
  getItem(index: number): StateTableEntry;
};

export type StateTable = {
  classTable: LookupTable;
  stateArray: StateArray;
  entryTable: EntryTable;
  nClasses: number;
};

type GlyphLike = Glyph;

type ProcessEntryFn = (
  glyph: GlyphLike,
  entry: StateTableEntry,
  index: number,
) => void;

type TraverseOptions = {
  enter?: (glyph: number, entry: StateTableEntry) => void;
  exit?: (glyph: number, entry: StateTableEntry) => void;
};

export default class AATStateMachine {
  #stateTable: StateTable;
  #lookupTable: AATLookupTable;

  constructor(stateTable: StateTable) {
    this.#stateTable = stateTable;
    this.#lookupTable = new AATLookupTable(stateTable.classTable);
  }

  process(glyphs: GlyphLike[], reverse: boolean, processEntry: ProcessEntryFn) {
    let currentState = START_OF_TEXT_STATE; // START_OF_LINE_STATE is used for kashida glyph insertions sometimes I think?
    let index = reverse ? glyphs.length - 1 : 0;
    let dir = reverse ? -1 : 1;

    while (
      (dir === 1 && index <= glyphs.length) ||
      (dir === -1 && index >= -1)
    ) {
      let glyph: GlyphLike | null = null;
      let classCode = OUT_OF_BOUNDS_CLASS;
      let shouldAdvance = true;

      if (index === glyphs.length || index === -1) {
        classCode = END_OF_TEXT_CLASS;
      } else {
        glyph = glyphs[index];
        if (glyph.id === 0xffff) {
          // deleted glyph
          classCode = DELETED_GLYPH_CLASS;
        } else {
          const lookupResult = this.#lookupTable.lookup(glyph.id);
          classCode = lookupResult ?? OUT_OF_BOUNDS_CLASS;
        }
      }

      const row = this.#stateTable.stateArray.getItem(currentState);
      const entryIndex = row[classCode];
      const entry = this.#stateTable.entryTable.getItem(entryIndex);

      if (
        classCode !== END_OF_TEXT_CLASS &&
        classCode !== DELETED_GLYPH_CLASS &&
        glyph
      ) {
        processEntry(glyph, entry, index);
        shouldAdvance = !(entry.flags & DONT_ADVANCE);
      }

      currentState = entry.newState;
      if (shouldAdvance) {
        index += dir;
      }
    }

    return glyphs;
  }

  /**
   * Performs a depth-first traversal of the glyph strings
   * represented by the state machine.
   */
  traverse(opts: TraverseOptions, state = 0, visited: Set<number> = new Set()) {
    if (visited.has(state)) {
      return;
    }

    visited.add(state);

    const { nClasses, stateArray, entryTable } = this.#stateTable;
    const row = stateArray.getItem(state);

    // Skip predefined classes
    for (let classCode = 4; classCode < nClasses; classCode++) {
      const entryIndex = row[classCode];
      const entry = entryTable.getItem(entryIndex);

      // Try all glyphs in the class
      for (const glyph of this.#lookupTable.glyphsForValue(classCode)) {
        if (opts.enter) {
          opts.enter(glyph, entry);
        }

        if (entry.newState !== 0) {
          this.traverse(opts, entry.newState, visited);
        }

        if (opts.exit) {
          opts.exit(glyph, entry);
        }
      }
    }
  }
}
