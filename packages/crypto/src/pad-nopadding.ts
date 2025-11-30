/**
 * A noop padding strategy.
 */
import type { Padding } from "./cipher-core.js";
import { WordArray } from "./core.js";

/**
 * A noop padding strategy.
 */
export const NoPadding: Padding = {
  pad(_data: WordArray, _blockSize: number): void {
    // No padding
  },

  unpad(_data: WordArray): void {
    // No unpadding
  },
};
