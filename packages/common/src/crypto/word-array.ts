import { randomBytes } from "node:crypto";

export interface Encoder {
  stringify(wordArray: WordArray): string;
  parse(str: string): WordArray;
}

export class WordArray {
  words: number[];
  sigBytes: number;

  constructor(words?: number[], sigBytes?: number) {
    this.words = words || [];
    this.sigBytes = sigBytes !== undefined ? sigBytes : this.words.length * 4;
  }

  static create(words?: number[], sigBytes?: number): WordArray {
    return new WordArray(words, sigBytes);
  }

  /**
   * Creates a word array filled with random bytes.
   */
  static random(nBytes: number): WordArray {
    const bytes = randomBytes(nBytes);
    return WordArray.fromUint8Array(bytes);
  }

  /**
   * Create WordArray from Uint8Array
   */
  static fromUint8Array(bytes: Uint8Array): WordArray {
    const words: number[] = [];
    for (let i = 0; i < bytes.length; i += 4) {
      words.push(
        ((bytes[i] || 0) << 24) |
          ((bytes[i + 1] || 0) << 16) |
          ((bytes[i + 2] || 0) << 8) |
          (bytes[i + 3] || 0),
      );
    }
    return new WordArray(words, bytes.length);
  }

  /**
   * Convert WordArray to Uint8Array
   */
  toUint8Array(): Uint8Array {
    const bytes = new Uint8Array(this.sigBytes);
    for (let i = 0; i < this.sigBytes; i++) {
      bytes[i] = (this.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return bytes;
  }

  toString(encoder?: Encoder): string {
    return (encoder || Hex).stringify(this);
  }

  concat(wordArray: WordArray): WordArray {
    const thisWords = this.words;
    const thatWords = wordArray.words;
    const thisSigBytes = this.sigBytes;
    const thatSigBytes = wordArray.sigBytes;

    this.clamp();

    if (thisSigBytes % 4) {
      for (let i = 0; i < thatSigBytes; i++) {
        const thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
      }
    } else {
      for (let j = 0; j < thatSigBytes; j += 4) {
        thisWords[(thisSigBytes + j) >>> 2] = thatWords[j >>> 2];
      }
    }
    this.sigBytes += thatSigBytes;

    return this;
  }

  clamp(): void {
    const words = this.words;
    const sigBytes = this.sigBytes;

    words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
    words.length = Math.ceil(sigBytes / 4);
  }

  clone(): WordArray {
    return new WordArray(this.words.slice(0), this.sigBytes);
  }
}

export const Hex: Encoder = {
  stringify(wordArray: WordArray): string {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const hexChars: string[] = [];

    for (let i = 0; i < sigBytes; i++) {
      const bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      hexChars.push((bite >>> 4).toString(16));
      hexChars.push((bite & 0x0f).toString(16));
    }

    return hexChars.join("");
  },

  parse(hexStr: string): WordArray {
    const hexStrLength = hexStr.length;
    const words: number[] = [];

    for (let i = 0; i < hexStrLength; i += 2) {
      words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
    }

    return new WordArray(words, hexStrLength / 2);
  },
};

export const Latin1: Encoder = {
  stringify(wordArray: WordArray): string {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const chars: string[] = [];

    for (let i = 0; i < sigBytes; i++) {
      const bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      chars.push(String.fromCharCode(bite));
    }

    return chars.join("");
  },

  parse(latin1Str: string): WordArray {
    const length = latin1Str.length;
    const words: number[] = [];

    for (let i = 0; i < length; i++) {
      words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
    }

    return new WordArray(words, length);
  },
};
