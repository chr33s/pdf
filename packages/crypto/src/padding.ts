import { type Padding, Pkcs7 } from "./cipher-core.ts";
import { WordArray } from "./core.js";

export const NoPadding: Padding = {
  pad(_data: WordArray, _blockSize: number): void {
    // No padding
  },

  unpad(_data: WordArray): void {
    // No unpadding
  },
};

export { Pkcs7 };
