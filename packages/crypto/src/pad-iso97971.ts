/**
 * ISO/IEC 9797-1 Padding Method 2.
 */
import type { Padding } from "./cipher-core.js";
import { WordArray } from "./core.js";
import { ZeroPadding } from "./pad-zeropadding.js";

/**
 * ISO/IEC 9797-1 Padding Method 2.
 */
export const Iso97971: Padding = {
  pad(data: WordArray, blockSize: number): void {
    // Add 0x80 byte
    data.concat(new WordArray([0x80000000], 1));

    // Zero pad the rest
    ZeroPadding.pad(data, blockSize);
  },

  unpad(data: WordArray): void {
    // Remove zero padding
    ZeroPadding.unpad(data);

    // Remove one more byte -- the 0x80 byte
    data.sigBytes--;
  },
};
