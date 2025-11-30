/**
 * x64 namespace.
 * 64-bit word operations.
 */

import { WordArray } from "./core.js";

/**
 * A 64-bit word.
 */
export class X64Word {
  high: number;
  low: number;

  /**
   * Initializes a newly created 64-bit word.
   *
   * @param high The high 32 bits.
   * @param low The low 32 bits.
   */
  constructor(high: number, low: number) {
    this.high = high;
    this.low = low;
  }

  /**
   * Creates a new X64Word instance
   */
  static create(high: number, low: number): X64Word {
    return new X64Word(high, low);
  }

  /**
   * Creates a clone of this X64Word.
   */
  clone(): X64Word {
    return new X64Word(this.high, this.low);
  }
}

/**
 * An array of 64-bit words.
 */
export class X64WordArray {
  words: X64Word[];
  sigBytes: number;

  /**
   * Initializes a newly created word array.
   *
   * @param words An array of CryptoJS.x64.Word objects.
   * @param sigBytes The number of significant bytes in the words.
   */
  constructor(words?: X64Word[], sigBytes?: number) {
    this.words = words || [];
    this.sigBytes = sigBytes !== undefined ? sigBytes : this.words.length * 8;
  }

  /**
   * Creates a new X64WordArray instance
   */
  static create(words?: X64Word[], sigBytes?: number): X64WordArray {
    return new X64WordArray(words, sigBytes);
  }

  /**
   * Converts this 64-bit word array to a 32-bit word array.
   *
   * @returns This word array as a 32-bit word array.
   */
  toX32(): WordArray {
    const x64Words = this.words;
    const x64WordsLength = x64Words.length;

    const x32Words: number[] = [];
    for (let i = 0; i < x64WordsLength; i++) {
      const x64Word = x64Words[i];
      x32Words.push(x64Word.high);
      x32Words.push(x64Word.low);
    }

    return new WordArray(x32Words, this.sigBytes);
  }

  /**
   * Creates a copy of this word array.
   *
   * @returns The clone.
   */
  clone(): X64WordArray {
    const words = this.words;
    const clonedWords: X64Word[] = [];

    for (let i = 0; i < words.length; i++) {
      clonedWords[i] = new X64Word(words[i].high, words[i].low);
    }

    return new X64WordArray(clonedWords, this.sigBytes);
  }
}

// Export for compatibility
export const x64 = {
  Word: X64Word,
  WordArray: X64WordArray,
};

export default {
  Word: X64Word,
  WordArray: X64WordArray,
};
