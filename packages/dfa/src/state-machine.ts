/** Initial state index for the state machine. */
export const INITIAL_STATE = 1;
/** Fail state index indicating no valid transition. */
export const FAIL_STATE = 0;

/** A match result: [start index, end index, captured tags]. */
export type Match = [start: number, end: number, tags: string[]];

/** Configuration for constructing a StateMachine. */
export interface StateMachineConfig {
  stateTable: number[][];
  accepting: boolean[];
  tags: string[][];
}

/**
 * A StateMachine represents a deterministic finite automaton.
 * It can perform matches over a sequence of values, similar to a regular expression.
 */
export default class StateMachine {
  readonly stateTable: number[][];
  readonly accepting: boolean[];
  readonly tags: string[][];

  constructor(dfa: StateMachineConfig) {
    this.stateTable = dfa.stateTable;
    this.accepting = dfa.accepting;
    this.tags = dfa.tags;
  }

  /**
   * Returns an iterable object that yields pattern matches over the input sequence.
   * Matches are of the form [startIndex, endIndex, tags].
   */
  match(input: readonly number[]): Iterable<Match> {
    const { stateTable, accepting, tags } = this;

    return {
      *[Symbol.iterator](): Iterator<Match> {
        let state = INITIAL_STATE;
        let startRun: number | null = null;
        let lastAccepting: number | null = null;
        let lastState = INITIAL_STATE;

        for (let index = 0; index < input.length; index++) {
          const symbol = input[index];

          lastState = state;
          state = stateTable[state]?.[symbol] ?? FAIL_STATE;

          if (state === FAIL_STATE) {
            if (startRun != null && lastAccepting != null && lastAccepting >= startRun) {
              yield [startRun, lastAccepting, tags[lastState] ?? []];
            }

            state = stateTable[INITIAL_STATE]?.[symbol] ?? FAIL_STATE;
            startRun = null;
          }

          if (state !== FAIL_STATE && startRun == null) {
            startRun = index;
          }

          if (accepting[state]) {
            lastAccepting = index;
          }

          if (state === FAIL_STATE) {
            state = INITIAL_STATE;
          }
        }

        if (startRun != null && lastAccepting != null && lastAccepting >= startRun) {
          yield [startRun, lastAccepting, tags[state] ?? []];
        }
      },
    };
  }

  /**
   * For each match over the input sequence, action functions matching
   * the tag definitions in the input pattern are called with the startIndex,
   * endIndex, and sub-match sequence.
   */
  apply(
    input: readonly number[],
    actions: Record<string, (start: number, end: number, slice: number[]) => void>,
  ): void {
    for (const [start, end, tagList] of this.match(input)) {
      for (const tag of tagList) {
        const handler = actions[tag];
        if (typeof handler === "function") {
          handler(start, end, input.slice(start, end + 1));
        }
      }
    }
  }
}
