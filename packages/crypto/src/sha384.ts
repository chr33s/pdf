/**
 * SHA-384 hash algorithm.
 * A truncated version of SHA-512.
 */

import { WordArray, type HasherConfig } from "./core.js";
import { createHmacHelper } from "./hmac.js";
import { SHA512 } from "./sha512.js";
import { X64Word, X64WordArray } from "./x64-core.js";

// SHA-384 initial hash values
const H384_INIT = () =>
  new X64WordArray([
    new X64Word(0xcbbb9d5d, 0xc1059ed8),
    new X64Word(0x629a292a, 0x367cd507),
    new X64Word(0x9159015a, 0x3070dd17),
    new X64Word(0x152fecd8, 0xf70e5939),
    new X64Word(0x67332667, 0xffc00b31),
    new X64Word(0x8eb44a87, 0x68581511),
    new X64Word(0xdb0c2e0d, 0x64f98fa7),
    new X64Word(0x47b5481d, 0xbefa4fa4),
  ]);

/**
 * SHA-384 hash algorithm.
 */
export class SHA384 extends SHA512 {
  protected override _getInitialHash(): X64WordArray {
    return H384_INIT();
  }

  constructor(cfg?: HasherConfig) {
    super(cfg);
  }

  protected override _doFinalize(): WordArray {
    const hash = super._doFinalize();
    hash.sigBytes -= 16;
    return hash;
  }
}

/**
 * Shortcut function to the hasher's object interface.
 */
export function sha384(message: WordArray | string): WordArray {
  return new SHA384().finalize(message);
}

/**
 * Shortcut function to the HMAC's object interface.
 */
export const HmacSHA384 = createHmacHelper(SHA384);

export default SHA384;
