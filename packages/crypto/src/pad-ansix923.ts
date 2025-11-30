/**
 * ANSI X.923 padding strategy.
 */
import type { Padding } from "./cipher-core.js";
import { WordArray } from "./core.js";

/**
 * ANSI X.923 padding strategy.
 */
export const AnsiX923: Padding = {
  pad(data: WordArray, blockSize: number): void {
    // Shortcuts
    const dataSigBytes = data.sigBytes;
    const blockSizeBytes = blockSize * 4;

    // Count padding bytes
    const nPaddingBytes = blockSizeBytes - (dataSigBytes % blockSizeBytes);

    // Compute last byte position
    const lastBytePos = dataSigBytes + nPaddingBytes - 1;

    // Pad
    data.clamp();
    data.words[lastBytePos >>> 2] |= nPaddingBytes << (24 - (lastBytePos % 4) * 8);
    data.sigBytes += nPaddingBytes;
  },

  unpad(data: WordArray): void {
    // Get number of padding bytes from last byte
    const nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

    // Remove padding
    data.sigBytes -= nPaddingBytes;
  },
};
