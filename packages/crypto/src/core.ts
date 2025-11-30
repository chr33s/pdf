/**
 * CryptoJS core components.
 * Converted to TypeScript ES6 ESM with private class fields.
 */

// Native crypto module
const cryptoModule = globalThis.crypto;

/**
 * Cryptographically secure pseudorandom number generator
 */
function cryptoSecureRandomInt(): number {
  if (cryptoModule) {
    // Use getRandomValues method (Browser)
    if (typeof cryptoModule.getRandomValues === "function") {
      try {
        return cryptoModule.getRandomValues(new Uint32Array(1))[0];
      } catch {
        // Fall through
      }
    }
  }
  throw new Error("Native crypto module could not be used to get secure random number.");
}

/**
 * Encoder interface
 */
export interface Encoder {
  stringify(wordArray: WordArray): string;
  parse(str: string): WordArray;
}

/**
 * Configuration object type
 */
export interface ConfigObject {
  [key: string]: unknown;
}

/**
 * An array of 32-bit words.
 */
export class WordArray {
  words: number[];
  sigBytes: number;

  /**
   * Initializes a newly created word array.
   *
   * @param words An array of 32-bit words.
   * @param sigBytes The number of significant bytes in the words.
   */
  constructor(words?: number[], sigBytes?: number) {
    this.words = words || [];
    this.sigBytes = sigBytes !== undefined ? sigBytes : this.words.length * 4;
  }

  /**
   * Creates a new WordArray instance
   */
  static create(words?: number[], sigBytes?: number): WordArray {
    return new WordArray(words, sigBytes);
  }

  /**
   * Converts this word array to a string.
   *
   * @param encoder The encoding strategy to use. Default: Hex
   * @returns The stringified word array.
   */
  toString(encoder?: Encoder): string {
    return (encoder || Hex).stringify(this);
  }

  /**
   * Concatenates a word array to this word array.
   *
   * @param wordArray The word array to append.
   * @returns This word array.
   */
  concat(wordArray: WordArray): WordArray {
    const thisWords = this.words;
    const thatWords = wordArray.words;
    const thisSigBytes = this.sigBytes;
    const thatSigBytes = wordArray.sigBytes;

    // Clamp excess bits
    this.clamp();

    // Concat
    if (thisSigBytes % 4) {
      // Copy one byte at a time
      for (let i = 0; i < thatSigBytes; i++) {
        const thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
      }
    } else {
      // Copy one word at a time
      for (let j = 0; j < thatSigBytes; j += 4) {
        thisWords[(thisSigBytes + j) >>> 2] = thatWords[j >>> 2];
      }
    }
    this.sigBytes += thatSigBytes;

    return this;
  }

  /**
   * Removes insignificant bits.
   */
  clamp(): void {
    const words = this.words;
    const sigBytes = this.sigBytes;

    words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
    words.length = Math.ceil(sigBytes / 4);
  }

  /**
   * Creates a copy of this word array.
   *
   * @returns The clone.
   */
  clone(): WordArray {
    const clone = new WordArray(this.words.slice(0), this.sigBytes);
    return clone;
  }

  /**
   * Creates a word array filled with random bytes.
   *
   * @param nBytes The number of random bytes to generate.
   * @returns The random word array.
   */
  static random(nBytes: number): WordArray {
    const words: number[] = [];

    for (let i = 0; i < nBytes; i += 4) {
      words.push(cryptoSecureRandomInt());
    }

    return new WordArray(words, nBytes);
  }
}

/**
 * Hex encoding strategy.
 */
export const Hex: Encoder = {
  /**
   * Converts a word array to a hex string.
   *
   * @param wordArray The word array.
   * @returns The hex string.
   */
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

  /**
   * Converts a hex string to a word array.
   *
   * @param hexStr The hex string.
   * @returns The word array.
   */
  parse(hexStr: string): WordArray {
    const hexStrLength = hexStr.length;

    const words: number[] = [];
    for (let i = 0; i < hexStrLength; i += 2) {
      words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
    }

    return new WordArray(words, hexStrLength / 2);
  },
};

/**
 * Latin1 encoding strategy.
 */
export const Latin1: Encoder = {
  /**
   * Converts a word array to a Latin1 string.
   *
   * @param wordArray The word array.
   * @returns The Latin1 string.
   */
  stringify(wordArray: WordArray): string {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;

    const latin1Chars: string[] = [];
    for (let i = 0; i < sigBytes; i++) {
      const bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      latin1Chars.push(String.fromCharCode(bite));
    }

    return latin1Chars.join("");
  },

  /**
   * Converts a Latin1 string to a word array.
   *
   * @param latin1Str The Latin1 string.
   * @returns The word array.
   */
  parse(latin1Str: string): WordArray {
    const latin1StrLength = latin1Str.length;

    const words: number[] = [];
    for (let i = 0; i < latin1StrLength; i++) {
      words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
    }

    return new WordArray(words, latin1StrLength);
  },
};

/**
 * UTF-8 encoding strategy.
 */
export const Utf8: Encoder = {
  /**
   * Converts a word array to a UTF-8 string.
   *
   * @param wordArray The word array.
   * @returns The UTF-8 string.
   */
  stringify(wordArray: WordArray): string {
    try {
      return decodeURIComponent(escape(Latin1.stringify(wordArray)));
    } catch {
      throw new Error("Malformed UTF-8 data");
    }
  },

  /**
   * Converts a UTF-8 string to a word array.
   *
   * @param utf8Str The UTF-8 string.
   * @returns The word array.
   */
  parse(utf8Str: string): WordArray {
    return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
  },
};

/**
 * Abstract buffered block algorithm template.
 */
export abstract class BufferedBlockAlgorithm {
  protected _data: WordArray = new WordArray();
  protected _nDataBytes: number = 0;

  blockSize: number = 16; // 512 bits

  /**
   * Resets this block algorithm's data buffer to its initial state.
   */
  reset(): void {
    this._data = new WordArray();
    this._nDataBytes = 0;
  }

  /**
   * Adds new data to this block algorithm's buffer.
   *
   * @param data The data to append. Strings are converted to a WordArray using UTF-8.
   */
  protected _append(data: WordArray | string): void {
    // Convert string to WordArray, else assume WordArray already
    if (typeof data === "string") {
      data = Utf8.parse(data);
    }

    // Append
    this._data.concat(data);
    this._nDataBytes += data.sigBytes;
  }

  /**
   * Processes available data blocks.
   *
   * @param doFlush Whether all blocks and partial blocks should be processed.
   * @returns The processed data.
   */
  protected _process(doFlush?: boolean): WordArray {
    let processedWords: number[] | undefined;

    const data = this._data;
    const dataWords = data.words;
    const dataSigBytes = data.sigBytes;
    const blockSize = this.blockSize;
    const blockSizeBytes = blockSize * 4;

    // Count blocks ready
    let nBlocksReady = dataSigBytes / blockSizeBytes;
    if (doFlush) {
      // Round up to include partial blocks
      nBlocksReady = Math.ceil(nBlocksReady);
    } else {
      // Round down to include only full blocks
      nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
    }

    // Count words ready
    const nWordsReady = nBlocksReady * blockSize;

    // Count bytes ready
    const nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

    // Process blocks
    if (nWordsReady) {
      for (let offset = 0; offset < nWordsReady; offset += blockSize) {
        // Perform concrete-algorithm logic
        this._doProcessBlock(dataWords, offset);
      }

      // Remove processed words
      processedWords = dataWords.splice(0, nWordsReady);
      data.sigBytes -= nBytesReady;
    }

    // Return processed words
    return new WordArray(processedWords, nBytesReady);
  }

  /**
   * Creates a copy of this object.
   *
   * @returns The clone.
   */
  clone(): BufferedBlockAlgorithm {
    const clone = Object.assign(
      Object.create(Object.getPrototypeOf(this)),
      this,
    ) as BufferedBlockAlgorithm;
    clone._data = this._data.clone();
    return clone;
  }

  protected _minBufferSize: number = 0;

  /**
   * Process a block of data. Must be implemented by subclass.
   */
  protected abstract _doProcessBlock(words: number[], offset: number): void;
}

/**
 * Hasher configuration
 */
export interface HasherConfig extends ConfigObject {
  // Hasher-specific configuration options
}

/**
 * Abstract hasher template.
 */
export abstract class Hasher extends BufferedBlockAlgorithm {
  cfg: HasherConfig;

  /**
   * Initializes a newly created hasher.
   *
   * @param cfg The configuration options to use for this hash computation.
   */
  constructor(cfg?: HasherConfig) {
    super();
    this.cfg = cfg || {};
    // Note: Subclasses must call reset() after their fields are initialized
  }

  /**
   * Resets this hasher to its initial state.
   */
  override reset(): void {
    super.reset();
    this._doReset();
  }

  /**
   * Updates this hasher with a message.
   *
   * @param messageUpdate The message to append.
   * @returns This hasher.
   */
  update(messageUpdate: WordArray | string): this {
    this._append(messageUpdate);
    this._process();
    return this;
  }

  /**
   * Finalizes the hash computation.
   * Note that the finalize operation is effectively a destructive, read-once operation.
   *
   * @param messageUpdate A final message update.
   * @returns The hash.
   */
  finalize(messageUpdate?: WordArray | string): WordArray {
    // Final message update
    if (messageUpdate) {
      this._append(messageUpdate);
    }

    // Perform concrete-hasher logic
    return this._doFinalize();
  }

  override blockSize: number = 512 / 32;

  /**
   * Reset hook for concrete implementations.
   */
  protected abstract _doReset(): void;

  /**
   * Finalize hook for concrete implementations.
   */
  protected abstract _doFinalize(): WordArray;
}

/**
 * Creates a shortcut function to a hasher's object interface.
 *
 * @param HasherClass The hasher class to create a helper for.
 * @returns The shortcut function.
 */
export function createHasherHelper<T extends Hasher>(
  HasherClass: new (cfg?: HasherConfig) => T,
): (message: WordArray | string, cfg?: HasherConfig) => WordArray {
  return (message: WordArray | string, cfg?: HasherConfig): WordArray => {
    return new HasherClass(cfg).finalize(message);
  };
}

// Re-export for compatibility
export { Hex as enc_Hex, Latin1 as enc_Latin1, Utf8 as enc_Utf8 };

// Export CryptoJS-like namespace for backward compatibility
export const lib = {
  WordArray,
  BufferedBlockAlgorithm,
  Hasher,
};

export const enc = {
  Hex,
  Latin1,
  Utf8,
};

export default {
  lib,
  enc,
  WordArray,
  Hex,
  Latin1,
  Utf8,
};
