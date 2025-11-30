/**
 * EVP key derivation function.
 * This key derivation function is meant to conform with EVP_BytesToKey.
 * www.openssl.org/docs/crypto/EVP_BytesToKey.html
 */

import { Hasher, WordArray, type HasherConfig } from "./core.js";
import { MD5 } from "./md5.js";

/**
 * EvpKDF configuration
 */
export interface EvpKDFConfig {
  keySize?: number;
  hasher?: typeof Hasher;
  iterations?: number;
}

/**
 * EVP key derivation function implementation.
 */
export class EvpKDF {
  #cfg: Required<EvpKDFConfig>;

  /**
   * Default configuration.
   */
  static defaultCfg: Required<EvpKDFConfig> = {
    keySize: 128 / 32,
    hasher: MD5,
    iterations: 1,
  };

  /**
   * Initializes a newly created key derivation function.
   *
   * @param cfg Configuration options.
   */
  constructor(cfg?: EvpKDFConfig) {
    this.#cfg = {
      ...EvpKDF.defaultCfg,
      ...cfg,
    };
  }

  /**
   * Creates a new EvpKDF instance.
   */
  static create(cfg?: EvpKDFConfig): EvpKDF {
    return new EvpKDF(cfg);
  }

  /**
   * Derives a key from a password.
   *
   * @param password The password.
   * @param salt A salt.
   * @returns The derived key.
   */
  compute(password: WordArray | string, salt: WordArray | string): WordArray {
    let block: WordArray | undefined;

    const cfg = this.#cfg;

    // Init hasher
    const HasherClass = cfg.hasher as unknown as new (cfg?: HasherConfig) => Hasher;
    const hasher = new HasherClass();

    // Initial values
    const derivedKey = new WordArray();
    const derivedKeyWords = derivedKey.words;
    const keySize = cfg.keySize;
    const iterations = cfg.iterations;

    // Generate key
    while (derivedKeyWords.length < keySize) {
      if (block) {
        hasher.update(block);
      }
      block = hasher.update(password).finalize(salt);
      hasher.reset();

      // Iterations
      for (let i = 1; i < iterations; i++) {
        block = hasher.finalize(block);
        hasher.reset();
      }

      derivedKey.concat(block);
    }
    derivedKey.sigBytes = keySize * 4;

    return derivedKey;
  }
}

/**
 * Derives a key from a password.
 *
 * @param password The password.
 * @param salt A salt.
 * @param cfg Configuration options.
 * @returns The derived key.
 */
export function evpKDF(
  password: WordArray | string,
  salt: WordArray | string,
  cfg?: EvpKDFConfig,
): WordArray {
  return new EvpKDF(cfg).compute(password, salt);
}

export default EvpKDF;
