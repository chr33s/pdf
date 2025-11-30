/**
 * Zero padding strategy.
 */
import type { Padding } from "./cipher-core.js";
import { WordArray } from "./core.js";

/**
 * Zero padding strategy.
 */
export const ZeroPadding: Padding = {
  pad(data: WordArray, blockSize: number): void {
    // Shortcut
    const blockSizeBytes = blockSize * 4;

    // Pad
    data.clamp();
    data.sigBytes += blockSizeBytes - (data.sigBytes % blockSizeBytes || blockSizeBytes);
  },

  unpad(data: WordArray): void {
    // Shortcut
    const dataWords = data.words;

    // Unpad
    for (let i = data.sigBytes - 1; i >= 0; i--) {
      if ((dataWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff) {
        data.sigBytes = i + 1;
        break;
      }
    }
  },
};
