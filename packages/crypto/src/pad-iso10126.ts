/**
 * ISO 10126 padding strategy.
 */
import type { Padding } from "./cipher-core.js";
import { WordArray } from "./core.js";

/**
 * ISO 10126 padding strategy.
 */
export const Iso10126: Padding = {
  pad(data: WordArray, blockSize: number): void {
    // Shortcut
    const blockSizeBytes = blockSize * 4;

    // Count padding bytes
    const nPaddingBytes = blockSizeBytes - (data.sigBytes % blockSizeBytes);

    // Pad
    data
      .concat(WordArray.random(nPaddingBytes - 1))
      .concat(new WordArray([nPaddingBytes << 24], 1));
  },

  unpad(data: WordArray): void {
    // Get number of padding bytes from last byte
    const nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

    // Remove padding
    data.sigBytes -= nPaddingBytes;
  },
};
