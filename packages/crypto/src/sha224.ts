/**
 * SHA-224 hash algorithm.
 */

import { WordArray, type HasherConfig } from "./core.js";
import { createHmacHelper } from "./hmac.js";
import { SHA256 } from "./sha256.js";

// SHA-224 initial hash values
const H224_INIT = [
  0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4,
];

/**
 * SHA-224 hash algorithm.
 * A truncated version of SHA-256.
 */
export class SHA224 extends SHA256 {
  protected override _getInitialHash(): number[] {
    return H224_INIT.slice(0);
  }

  constructor(cfg?: HasherConfig) {
    super(cfg);
  }

  protected override _doFinalize(): WordArray {
    const hash = super._doFinalize();
    hash.sigBytes -= 4;
    return hash;
  }
}

/**
 * Shortcut function to the hasher's object interface.
 */
export function sha224(message: WordArray | string): WordArray {
  return new SHA224().finalize(message);
}

/**
 * Shortcut function to the HMAC's object interface.
 */
export const HmacSHA224 = createHmacHelper(SHA224);

export default SHA224;
