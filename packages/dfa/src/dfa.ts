import {
  Concatenation,
  EndMarker,
  ExpressionNode,
  Literal,
  PositionNode,
  Tag,
} from "./nodes.js";
import { addAll, equal } from "./utils.js";

const END_MARKER = new EndMarker();

export interface DFAState {
  positions: Set<PositionNode>;
  transitions: Uint16Array;
  accepting: boolean;
  marked: boolean;
  tags: Set<string>;
}

/**
 * This is an implementation of the direct regular expression to DFA algorithm described
 * in section 3.9.5 of "Compilers: Principles, Techniques, and Tools" by Aho,
 * Lam, Sethi, and Ullman. http://dragonbook.stanford.edu
 * There is a PDF of the book here:
 * http://www.informatik.uni-bremen.de/agbkb/lehre/ccfl/Material/ALSUdragonbook.pdf
 */
export default function buildDFA(
  root: ExpressionNode,
  numSymbols: number,
): DFAState[] {
  const augmentedRoot = new Concatenation(root, END_MARKER);
  augmentedRoot.calcFollowpos();

  const failState = new State(new Set<PositionNode>(), numSymbols);
  const initialState = new State(augmentedRoot.firstpos, numSymbols);
  const dstates: State[] = [failState, initialState];

  // while there is an unmarked state S in dstates
  while (true) {
    let s: State | null = null;

    for (let j = 1; j < dstates.length; j++) {
      if (!dstates[j].marked) {
        s = dstates[j];
        break;
      }
    }

    if (s == null) {
      break;
    }

    // mark S
    s.marked = true;

    // for each input symbol a
    for (let a = 0; a < numSymbols; a++) {
      // let U be the union of followpos(p) for all
      //  p in S that correspond to a
      const u = new Set<PositionNode>();
      for (const p of s.positions) {
        if (p instanceof Literal && p.value === a) {
          addAll(u, p.followpos);
        }
      }

      if (u.size === 0) {
        continue;
      }

      // if U is not in dstates
      let ux = -1;
      for (let i = 0; i < dstates.length; i++) {
        if (equal(u, dstates[i].positions)) {
          ux = i;
          break;
        }
      }

      if (ux === -1) {
        // Add U as an unmarked state to dstates
        dstates.push(new State(u, numSymbols));
        ux = dstates.length - 1;
      }

      s.transitions[a] = ux;
    }
  }

  return dstates;
}

class State implements DFAState {
  readonly positions: Set<PositionNode>;
  readonly transitions: Uint16Array;
  readonly accepting: boolean;
  marked: boolean;
  readonly tags: Set<string>;

  constructor(positions: Set<PositionNode>, len: number) {
    this.positions = positions;
    this.transitions = new Uint16Array(len);
    this.accepting = positions.has(END_MARKER);
    this.marked = false;
    this.tags = new Set<string>();

    for (const pos of positions) {
      if (pos instanceof Tag) {
        this.tags.add(pos.name);
      }
    }
  }
}
