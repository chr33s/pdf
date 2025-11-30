/**
 * HMAC algorithm.
 */

import { Hasher, Utf8, WordArray, type HasherConfig } from "./core.js";

/**
 * Hasher class type for HMAC
 */
export type HasherClass = new (cfg?: HasherConfig) => Hasher;

/**
 * HMAC algorithm implementation.
 */
export class HMAC {
  #hasher: Hasher;
  #oKey: WordArray;
  #iKey: WordArray;

  /**
   * Initializes a newly created HMAC.
   *
   * @param HasherClass The hash algorithm class to use.
   * @param key The secret key.
   */
  constructor(HasherClass: HasherClass, key: WordArray | string) {
    // Init hasher
    this.#hasher = new HasherClass();

    // Convert string to WordArray, else assume WordArray already
    let keyWA: WordArray;
    if (typeof key === "string") {
      keyWA = Utf8.parse(key);
    } else {
      keyWA = key;
    }

    // Shortcuts
    const hasherBlockSize = this.#hasher.blockSize;
    const hasherBlockSizeBytes = hasherBlockSize * 4;

    // Allow arbitrary length keys
    if (keyWA.sigBytes > hasherBlockSizeBytes) {
      keyWA = new HasherClass().finalize(keyWA);
    }

    // Clamp excess bits
    keyWA.clamp();

    // Clone key for inner and outer pads
    this.#oKey = keyWA.clone();
    this.#iKey = keyWA.clone();

    // Shortcuts
    const oKeyWords = this.#oKey.words;
    const iKeyWords = this.#iKey.words;

    // XOR keys with pad constants
    for (let i = 0; i < hasherBlockSize; i++) {
      oKeyWords[i] ^= 0x5c5c5c5c;
      iKeyWords[i] ^= 0x36363636;
    }
    this.#oKey.sigBytes = this.#iKey.sigBytes = hasherBlockSizeBytes;

    // Set initial values
    this.reset();
  }

  /**
   * Creates a new HMAC instance
   */
  static create(HasherClass: HasherClass, key: WordArray | string): HMAC {
    return new HMAC(HasherClass, key);
  }

  /**
   * Resets this HMAC to its initial state.
   */
  reset(): void {
    // Reset
    this.#hasher.reset();
    this.#hasher.update(this.#iKey);
  }

  /**
   * Updates this HMAC with a message.
   *
   * @param messageUpdate The message to append.
   * @returns This HMAC instance.
   */
  update(messageUpdate: WordArray | string): this {
    this.#hasher.update(messageUpdate);
    return this;
  }

  /**
   * Finalizes the HMAC computation.
   * Note that the finalize operation is effectively a destructive, read-once operation.
   *
   * @param messageUpdate A final message update.
   * @returns The HMAC.
   */
  finalize(messageUpdate?: WordArray | string): WordArray {
    // Compute HMAC
    const innerHash = this.#hasher.finalize(messageUpdate);
    this.#hasher.reset();
    const hmac = this.#hasher.finalize(this.#oKey.clone().concat(innerHash));

    return hmac;
  }
}

/**
 * Creates a shortcut function to the HMAC's object interface.
 *
 * @param HasherClass The hasher class to use in this HMAC helper.
 * @returns The shortcut function.
 */
export function createHmacHelper(
  HasherClass: HasherClass,
): (message: WordArray | string, key: WordArray | string) => WordArray {
  return (message: WordArray | string, key: WordArray | string): WordArray => {
    return new HMAC(HasherClass, key).finalize(message);
  };
}

export default HMAC;
