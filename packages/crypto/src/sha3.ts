/**
 * SHA-3 hash algorithm.
 */
import { Hasher, WordArray, type HasherConfig } from "./core.js";
import { createHmacHelper } from "./hmac.js";
import { X64Word } from "./x64-core.js";

// Constants tables
const RHO_OFFSETS: number[] = [];
const PI_INDEXES: number[] = [];
const ROUND_CONSTANTS: X64Word[] = [];

// Compute Constants
(function () {
  // Compute rho offset constants
  let x = 1;
  let y = 0;
  for (let t = 0; t < 24; t++) {
    RHO_OFFSETS[x + 5 * y] = (((t + 1) * (t + 2)) / 2) % 64;

    const newX = y % 5;
    const newY = (2 * x + 3 * y) % 5;
    x = newX;
    y = newY;
  }

  // Compute pi index constants
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      PI_INDEXES[x + 5 * y] = y + ((2 * x + 3 * y) % 5) * 5;
    }
  }

  // Compute round constants
  let LFSR = 0x01;
  for (let i = 0; i < 24; i++) {
    let roundConstantMsw = 0;
    let roundConstantLsw = 0;

    for (let j = 0; j < 7; j++) {
      if (LFSR & 0x01) {
        const bitPosition = (1 << j) - 1;
        if (bitPosition < 32) {
          roundConstantLsw ^= 1 << bitPosition;
        } else {
          roundConstantMsw ^= 1 << (bitPosition - 32);
        }
      }

      // Compute next LFSR
      if (LFSR & 0x80) {
        // Primitive polynomial over GF(2): x^8 + x^6 + x^5 + x^4 + 1
        LFSR = (LFSR << 1) ^ 0x71;
      } else {
        LFSR <<= 1;
      }
    }

    ROUND_CONSTANTS[i] = new X64Word(roundConstantMsw, roundConstantLsw);
  }
})();

// Reusable objects for temporary values
const T: X64Word[] = [];
for (let i = 0; i < 25; i++) {
  T[i] = new X64Word(0, 0);
}

/**
 * Configuration options for SHA3.
 */
export interface SHA3Config extends HasherConfig {
  /**
   * The desired number of bits in the output hash.
   * Only values permitted are: 224, 256, 384, 512.
   * Default: 512
   */
  outputLength?: number;
}

/**
 * SHA-3 hash algorithm.
 */
export class SHA3 extends Hasher {
  declare cfg: SHA3Config;
  protected _state: X64Word[] = [];

  constructor(cfg: SHA3Config = {}) {
    super({
      outputLength: 512,
      ...cfg,
    });
    this.reset();
  }

  protected _doReset(): void {
    const state: X64Word[] = (this._state = []);
    for (let i = 0; i < 25; i++) {
      state[i] = new X64Word(0, 0);
    }

    this.blockSize = (1600 - 2 * (this.cfg.outputLength ?? 512)) / 32;
  }

  protected _doProcessBlock(M: number[], offset: number): void {
    // Shortcuts
    const state = this._state;
    const nBlockSizeLanes = this.blockSize / 2;

    // Absorb
    for (let i = 0; i < nBlockSizeLanes; i++) {
      // Shortcuts
      let M2i = M[offset + 2 * i];
      let M2i1 = M[offset + 2 * i + 1];

      // Swap endian
      M2i = (((M2i << 8) | (M2i >>> 24)) & 0x00ff00ff) | (((M2i << 24) | (M2i >>> 8)) & 0xff00ff00);
      M2i1 =
        (((M2i1 << 8) | (M2i1 >>> 24)) & 0x00ff00ff) | (((M2i1 << 24) | (M2i1 >>> 8)) & 0xff00ff00);

      // Absorb message into state
      const lane = state[i];
      lane.high ^= M2i1;
      lane.low ^= M2i;
    }

    // Rounds
    for (let round = 0; round < 24; round++) {
      // Theta
      for (let x = 0; x < 5; x++) {
        // Mix column lanes
        let tMsw = 0;
        let tLsw = 0;
        for (let y = 0; y < 5; y++) {
          const lane = state[x + 5 * y];
          tMsw ^= lane.high;
          tLsw ^= lane.low;
        }

        // Temporary values
        const Tx = T[x];
        Tx.high = tMsw;
        Tx.low = tLsw;
      }
      for (let x = 0; x < 5; x++) {
        // Shortcuts
        const Tx4 = T[(x + 4) % 5];
        const Tx1 = T[(x + 1) % 5];
        const Tx1Msw = Tx1.high;
        const Tx1Lsw = Tx1.low;

        // Mix surrounding columns
        const tMsw = Tx4.high ^ ((Tx1Msw << 1) | (Tx1Lsw >>> 31));
        const tLsw = Tx4.low ^ ((Tx1Lsw << 1) | (Tx1Msw >>> 31));
        for (let y = 0; y < 5; y++) {
          const lane = state[x + 5 * y];
          lane.high ^= tMsw;
          lane.low ^= tLsw;
        }
      }

      // Rho Pi
      for (let laneIndex = 1; laneIndex < 25; laneIndex++) {
        let tMsw: number;
        let tLsw: number;

        // Shortcuts
        const lane = state[laneIndex];
        const laneMsw = lane.high;
        const laneLsw = lane.low;
        const rhoOffset = RHO_OFFSETS[laneIndex];

        // Rotate lanes
        if (rhoOffset < 32) {
          tMsw = (laneMsw << rhoOffset) | (laneLsw >>> (32 - rhoOffset));
          tLsw = (laneLsw << rhoOffset) | (laneMsw >>> (32 - rhoOffset));
        } else {
          tMsw = (laneLsw << (rhoOffset - 32)) | (laneMsw >>> (64 - rhoOffset));
          tLsw = (laneMsw << (rhoOffset - 32)) | (laneLsw >>> (64 - rhoOffset));
        }

        // Transpose lanes
        const TPiLane = T[PI_INDEXES[laneIndex]];
        TPiLane.high = tMsw;
        TPiLane.low = tLsw;
      }

      // Rho pi at x = y = 0
      const T0 = T[0];
      const state0 = state[0];
      T0.high = state0.high;
      T0.low = state0.low;

      // Chi
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          // Shortcuts
          const laneIndex = x + 5 * y;
          const lane = state[laneIndex];
          const TLane = T[laneIndex];
          const Tx1Lane = T[((x + 1) % 5) + 5 * y];
          const Tx2Lane = T[((x + 2) % 5) + 5 * y];

          // Mix rows
          lane.high = TLane.high ^ (~Tx1Lane.high & Tx2Lane.high);
          lane.low = TLane.low ^ (~Tx1Lane.low & Tx2Lane.low);
        }
      }

      // Iota
      const lane = state[0];
      const roundConstant = ROUND_CONSTANTS[round];
      lane.high ^= roundConstant.high;
      lane.low ^= roundConstant.low;
    }
  }

  protected _doFinalize(): WordArray {
    // Shortcuts
    const data = this._data;
    const dataWords = data.words;
    const nBitsLeft = data.sigBytes * 8;
    const blockSizeBits = this.blockSize * 32;

    // Add padding
    dataWords[nBitsLeft >>> 5] |= 0x1 << (24 - (nBitsLeft % 32));
    dataWords[(Math.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits) >>> (5 - 1)] |= 0x80;
    data.sigBytes = dataWords.length * 4;

    // Hash final blocks
    this._process();

    // Shortcuts
    const state = this._state;
    const outputLengthBytes = (this.cfg.outputLength ?? 512) / 8;
    const outputLengthLanes = outputLengthBytes / 8;

    // Squeeze
    const hashWords: number[] = [];
    for (let i = 0; i < outputLengthLanes; i++) {
      // Shortcuts
      const lane = state[i];
      let laneMsw = lane.high;
      let laneLsw = lane.low;

      // Swap endian
      laneMsw =
        (((laneMsw << 8) | (laneMsw >>> 24)) & 0x00ff00ff) |
        (((laneMsw << 24) | (laneMsw >>> 8)) & 0xff00ff00);
      laneLsw =
        (((laneLsw << 8) | (laneLsw >>> 24)) & 0x00ff00ff) |
        (((laneLsw << 24) | (laneLsw >>> 8)) & 0xff00ff00);

      // Squeeze state to retrieve hash
      hashWords.push(laneLsw);
      hashWords.push(laneMsw);
    }

    // Return final computed hash
    return new WordArray(hashWords, outputLengthBytes);
  }

  override clone(): SHA3 {
    const clone = super.clone() as SHA3;
    clone.cfg = { ...this.cfg };

    const state = (clone._state = this._state.slice(0));
    for (let i = 0; i < 25; i++) {
      state[i] = state[i].clone();
    }

    return clone;
  }
}

/**
 * Shortcut function to the hasher's object interface.
 *
 * @param message The message to hash.
 * @param cfg Configuration options.
 * @returns The hash.
 *
 * @example
 *
 *     const hash = sha3('message');
 *     const hash = sha3(wordArray);
 *     const hash = sha3('message', { outputLength: 256 });
 */
export function sha3(message: WordArray | string, cfg?: SHA3Config): WordArray {
  return new SHA3(cfg).finalize(message);
}

/**
 * Shortcut function to the HMAC's object interface.
 *
 * @param message The message to hash.
 * @param key The secret key.
 * @returns The HMAC.
 *
 * @example
 *
 *     const hmac = HmacSHA3(message, key);
 */
export const HmacSHA3 = createHmacHelper(SHA3);
