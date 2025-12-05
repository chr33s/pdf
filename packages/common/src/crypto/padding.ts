import { WordArray } from "./word-array.js";

export interface Padding {
  pad(data: WordArray, blockSize: number): void;
  unpad(data: WordArray): void;
}

export const Pkcs7: Padding = {
  pad(data: WordArray, blockSize: number): void {
    const blockSizeBytes = blockSize * 4;
    const nPaddingBytes = blockSizeBytes - (data.sigBytes % blockSizeBytes);
    const paddingWord =
      (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;

    const paddingWords: number[] = [];
    for (let i = 0; i < nPaddingBytes; i += 4) {
      paddingWords.push(paddingWord);
    }
    const padding = new WordArray(paddingWords, nPaddingBytes);
    data.concat(padding);
  },

  unpad(data: WordArray): void {
    const nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;
    data.sigBytes -= nPaddingBytes;
  },
};

export const NoPadding: Padding = {
  pad(_data: WordArray, _blockSize: number): void {
    // No padding
  },
  unpad(_data: WordArray): void {
    // No unpadding
  },
};
