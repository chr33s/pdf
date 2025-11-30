/**
 * Base64url encoding strategy.
 */

import { WordArray, type Encoder } from "./core.js";

const BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const BASE64URL_SAFE_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function parseLoop(base64Str: string, base64StrLength: number, reverseMap: number[]): WordArray {
  const words: number[] = [];
  let nBytes = 0;
  for (let i = 0; i < base64StrLength; i++) {
    if (i % 4) {
      const bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
      const bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
      const bitsCombined = bits1 | bits2;
      words[nBytes >>> 2] |= bitsCombined << (24 - (nBytes % 4) * 8);
      nBytes++;
    }
  }
  return new WordArray(words, nBytes);
}

/**
 * Base64url encoding strategy with URL-safe characters.
 */
export const Base64url: Encoder & {
  _map: string;
  _safe_map: string;
  _reverseMap?: number[];
  stringify(wordArray: WordArray, urlSafe?: boolean): string;
  parse(base64Str: string, urlSafe?: boolean): WordArray;
} = {
  /**
   * Converts a word array to a Base64url string.
   *
   * @param wordArray The word array.
   * @param urlSafe Whether to use url safe characters (default: true)
   * @returns The Base64url string.
   */
  stringify(wordArray: WordArray, urlSafe: boolean = true): string {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const map = urlSafe ? this._safe_map : this._map;

    // Clamp excess bits
    wordArray.clamp();

    // Convert
    const base64Chars: string[] = [];
    for (let i = 0; i < sigBytes; i += 3) {
      const byte1 = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      const byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
      const byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

      const triplet = (byte1 << 16) | (byte2 << 8) | byte3;

      for (let j = 0; j < 4 && i + j * 0.75 < sigBytes; j++) {
        base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
      }
    }

    // Add padding (only for non-URL-safe mode)
    const paddingChar = map.charAt(64);
    if (paddingChar) {
      while (base64Chars.length % 4) {
        base64Chars.push(paddingChar);
      }
    }

    return base64Chars.join("");
  },

  /**
   * Converts a Base64url string to a word array.
   *
   * @param base64Str The Base64url string.
   * @param urlSafe Whether to use url safe characters (default: true)
   * @returns The word array.
   */
  parse(base64Str: string, urlSafe: boolean = true): WordArray {
    let base64StrLength = base64Str.length;
    const map = urlSafe ? this._safe_map : this._map;
    let reverseMap = this._reverseMap;

    if (!reverseMap) {
      reverseMap = this._reverseMap = [];
      for (let j = 0; j < map.length; j++) {
        reverseMap[map.charCodeAt(j)] = j;
      }
    }

    // Ignore padding
    const paddingChar = map.charAt(64);
    if (paddingChar) {
      const paddingIndex = base64Str.indexOf(paddingChar);
      if (paddingIndex !== -1) {
        base64StrLength = paddingIndex;
      }
    }

    // Convert
    return parseLoop(base64Str, base64StrLength, reverseMap);
  },

  _map: BASE64_MAP,
  _safe_map: BASE64URL_SAFE_MAP,
};

export default Base64url;
