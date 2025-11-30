/**
 * Password-Based Key Derivation Function 2 algorithm.
 */
import { WordArray } from "./core.js";
import { HMAC, type HasherClass } from "./hmac.js";
import { SHA256 } from "./sha256.js";

/**
 * Configuration options for PBKDF2.
 */
export interface PBKDF2Config {
  /**
   * The key size in words to generate. Default: 4 (128 bits)
   */
  keySize?: number;
  /**
   * The hasher to use. Default: SHA256
   */
  hasher?: HasherClass;
  /**
   * The number of iterations to perform. Default: 250000
   */
  iterations?: number;
}

/**
 * Password-Based Key Derivation Function 2 algorithm.
 */
export class PBKDF2 {
  #cfg: Required<PBKDF2Config>;

  /**
   * Initializes a newly created key derivation function.
   *
   * @param cfg The configuration options to use for the derivation.
   *
   * @example
   *
   *     const kdf = new PBKDF2();
   *     const kdf = new PBKDF2({ keySize: 8 });
   *     const kdf = new PBKDF2({ keySize: 8, iterations: 1000 });
   */
  constructor(cfg: PBKDF2Config = {}) {
    this.#cfg = {
      keySize: 128 / 32,
      hasher: SHA256,
      iterations: 250000,
      ...cfg,
    };
  }

  /**
   * Computes the Password-Based Key Derivation Function 2.
   *
   * @param password The password.
   * @param salt A salt.
   *
   * @returns The derived key.
   *
   * @example
   *
   *     const key = kdf.compute(password, salt);
   */
  compute(password: WordArray | string, salt: WordArray | string): WordArray {
    const cfg = this.#cfg;

    // Init HMAC
    const hmac = new HMAC(cfg.hasher, password);

    // Initial values
    const derivedKey = new WordArray();
    const blockIndex = new WordArray([0x00000001]);

    // Shortcuts
    const derivedKeyWords = derivedKey.words;
    const blockIndexWords = blockIndex.words;
    const keySize = cfg.keySize;
    const iterations = cfg.iterations;

    // Generate key
    while (derivedKeyWords.length < keySize) {
      let block = hmac.update(salt).finalize(blockIndex);
      hmac.reset();

      // Shortcuts
      const blockWords = block.words;
      const blockWordsLength = blockWords.length;

      // Iterations
      let intermediate = block;
      for (let i = 1; i < iterations; i++) {
        intermediate = hmac.finalize(intermediate);
        hmac.reset();

        // Shortcut
        const intermediateWords = intermediate.words;

        // XOR intermediate with block
        for (let j = 0; j < blockWordsLength; j++) {
          blockWords[j] ^= intermediateWords[j];
        }
      }

      derivedKey.concat(block);
      blockIndexWords[0]++;
    }
    derivedKey.sigBytes = keySize * 4;

    return derivedKey;
  }
}

/**
 * Computes the Password-Based Key Derivation Function 2.
 *
 * @param password The password.
 * @param salt A salt.
 * @param cfg The configuration options to use for this computation.
 *
 * @returns The derived key.
 *
 * @example
 *
 *     const key = pbkdf2(password, salt);
 *     const key = pbkdf2(password, salt, { keySize: 8 });
 *     const key = pbkdf2(password, salt, { keySize: 8, iterations: 1000 });
 */
export function pbkdf2(
  password: WordArray | string,
  salt: WordArray | string,
  cfg?: PBKDF2Config,
): WordArray {
  return new PBKDF2(cfg).compute(password, salt);
}
