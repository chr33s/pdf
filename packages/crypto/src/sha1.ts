/**
 * SHA-1 hash algorithm.
 */

import { Hasher, WordArray, type HasherConfig } from "./core.js";
import { createHmacHelper } from "./hmac.js";

// Reusable object
const W: number[] = [];

/**
 * SHA-1 hash algorithm.
 */
export class SHA1 extends Hasher {
  protected _hash: WordArray = new WordArray([
    0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0,
  ]);

  constructor(cfg?: HasherConfig) {
    super(cfg);
    this.reset();
  }

  protected _doReset(): void {
    this._hash = new WordArray([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]);
  }

  protected _doProcessBlock(M: number[], offset: number): void {
    const H = this._hash.words;

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];

    for (let i = 0; i < 80; i++) {
      if (i < 16) {
        W[i] = M[offset + i] | 0;
      } else {
        const n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
        W[i] = (n << 1) | (n >>> 31);
      }

      let t = ((a << 5) | (a >>> 27)) + e + W[i];
      if (i < 20) {
        t += ((b & c) | (~b & d)) + 0x5a827999;
      } else if (i < 40) {
        t += (b ^ c ^ d) + 0x6ed9eba1;
      } else if (i < 60) {
        t += ((b & c) | (b & d) | (c & d)) - 0x70e44324;
      } else {
        t += (b ^ c ^ d) - 0x359d3e2a;
      }

      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
  }

  protected _doFinalize(): WordArray {
    const data = this._data;
    const dataWords = data.words;

    const nBitsTotal = this._nDataBytes * 8;
    const nBitsLeft = data.sigBytes * 8;

    dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - (nBitsLeft % 32));
    dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
    dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
    data.sigBytes = dataWords.length * 4;

    this._process();

    return this._hash;
  }

  override clone(): SHA1 {
    const clone = super.clone() as SHA1;
    clone._hash = this._hash.clone();
    return clone;
  }
}

/**
 * Shortcut function to the hasher's object interface.
 */
export function sha1(message: WordArray | string): WordArray {
  return new SHA1().finalize(message);
}

/**
 * Shortcut function to the HMAC's object interface.
 */
export const HmacSHA1 = createHmacHelper(SHA1);

export default SHA1;
