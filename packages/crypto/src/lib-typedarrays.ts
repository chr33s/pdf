/**
 * Typed arrays support for WordArray.
 */

import { WordArray } from "./core.js";

// Check for typed arrays support
const supportsTypedArrays =
  typeof ArrayBuffer !== "undefined" &&
  typeof Uint8Array !== "undefined" &&
  typeof Int8Array !== "undefined";

/**
 * Converts a word array to a typed array (Uint8Array).
 *
 * @param wordArray The word array.
 * @returns The typed array.
 */
export function wordArrayToTypedArray(wordArray: WordArray): Uint8Array {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;

  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }

  return u8;
}

/**
 * Converts a typed array (ArrayBufferView) to a word array.
 *
 * @param typedArray The typed array.
 * @returns The word array.
 */
export function typedArrayToWordArray(typedArray: ArrayBufferView): WordArray {
  // Handle ArrayBuffer
  let u8: Uint8Array;
  if (typedArray instanceof ArrayBuffer) {
    u8 = new Uint8Array(typedArray);
  } else {
    u8 = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
  }

  const sigBytes = u8.length;
  const words: number[] = [];

  for (let i = 0; i < sigBytes; i++) {
    words[i >>> 2] |= u8[i] << (24 - (i % 4) * 8);
  }

  return new WordArray(words, sigBytes);
}

/**
 * Initializes a newly created word array from typed array.
 *
 * @param typedArray A typed array.
 * @returns The word array.
 */
export function wordArrayFromTypedArray(typedArray: ArrayBufferView | ArrayBuffer): WordArray {
  let u8: Uint8Array;
  if (typedArray instanceof ArrayBuffer) {
    u8 = new Uint8Array(typedArray);
  } else {
    u8 = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
  }

  const sigBytes = u8.length;
  const words: number[] = [];

  for (let i = 0; i < sigBytes; i++) {
    words[i >>> 2] |= u8[i] << (24 - (i % 4) * 8);
  }

  return new WordArray(words, sigBytes);
}

export { supportsTypedArrays };

export default {
  wordArrayToTypedArray,
  typedArrayToWordArray,
  wordArrayFromTypedArray,
  supportsTypedArrays,
};
