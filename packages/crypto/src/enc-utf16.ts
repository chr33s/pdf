/**
 * UTF-16 encoding strategies.
 */

import { WordArray, type Encoder } from "./core.js";

/**
 * Swaps the endianness of a 16-bit value.
 */
function swapEndian(word: number): number {
  return ((word << 8) & 0xff00ff00) | ((word >>> 8) & 0x00ff00ff);
}

/**
 * UTF-16 BE encoding strategy.
 */
export const Utf16BE: Encoder = {
  /**
   * Converts a word array to a UTF-16 BE string.
   *
   * @param wordArray The word array.
   * @returns The UTF-16 BE string.
   */
  stringify(wordArray: WordArray): string {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;

    const utf16Chars: string[] = [];
    for (let i = 0; i < sigBytes; i += 2) {
      const codePoint = (words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff;
      utf16Chars.push(String.fromCharCode(codePoint));
    }

    return utf16Chars.join("");
  },

  /**
   * Converts a UTF-16 BE string to a word array.
   *
   * @param utf16Str The UTF-16 BE string.
   * @returns The word array.
   */
  parse(utf16Str: string): WordArray {
    const utf16StrLength = utf16Str.length;

    const words: number[] = [];
    for (let i = 0; i < utf16StrLength; i++) {
      words[i >>> 1] |= utf16Str.charCodeAt(i) << (16 - (i % 2) * 16);
    }

    return new WordArray(words, utf16StrLength * 2);
  },
};

/**
 * UTF-16 LE encoding strategy.
 */
export const Utf16LE: Encoder = {
  /**
   * Converts a word array to a UTF-16 LE string.
   *
   * @param wordArray The word array.
   * @returns The UTF-16 LE string.
   */
  stringify(wordArray: WordArray): string {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;

    const utf16Chars: string[] = [];
    for (let i = 0; i < sigBytes; i += 2) {
      const codePoint = swapEndian((words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff);
      utf16Chars.push(String.fromCharCode(codePoint));
    }

    return utf16Chars.join("");
  },

  /**
   * Converts a UTF-16 LE string to a word array.
   *
   * @param utf16Str The UTF-16 LE string.
   * @returns The word array.
   */
  parse(utf16Str: string): WordArray {
    const utf16StrLength = utf16Str.length;

    const words: number[] = [];
    for (let i = 0; i < utf16StrLength; i++) {
      words[i >>> 1] |= swapEndian(utf16Str.charCodeAt(i) << (16 - (i % 2) * 16));
    }

    return new WordArray(words, utf16StrLength * 2);
  },
};

// Utf16 is alias for Utf16BE
export const Utf16 = Utf16BE;

export default {
  Utf16,
  Utf16BE,
  Utf16LE,
};
