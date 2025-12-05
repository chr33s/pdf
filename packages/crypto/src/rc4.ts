import { createCipherHelper, StreamCipher, type CipherConfig } from "./cipher-core.js";
import { WordArray } from "./core.js";

export class RC4 extends StreamCipher {
  static override keySize = 256 / 32;
  static override ivSize = 0;

  #S: number[] = [];
  #i = 0;
  #j = 0;

  constructor(xformMode: number, key: WordArray, cfg?: CipherConfig) {
    super(xformMode, key, cfg);
    this.reset(); // Initialize after private fields are set up
  }

  protected override _doReset(): void {
    // Shortcuts
    const key = this._key;
    const keyWords = key.words;
    const keySigBytes = key.sigBytes;

    // Init sbox
    const S: number[] = (this.#S = []);
    for (let i = 0; i < 256; i++) {
      S[i] = i;
    }

    // Key setup
    let j = 0;
    for (let i = 0; i < 256; i++) {
      const keyByteIndex = i % keySigBytes;
      const keyByte = (keyWords[keyByteIndex >>> 2] >>> (24 - (keyByteIndex % 4) * 8)) & 0xff;

      j = (j + S[i] + keyByte) % 256;

      // Swap
      const t = S[i];
      S[i] = S[j];
      S[j] = t;
    }

    // Counters
    this.#i = 0;
    this.#j = 0;
  }

  protected override _doProcessBlock(M: number[], offset: number): void {
    M[offset] ^= this.#generateKeystreamWord();
  }

  #generateKeystreamWord(): number {
    // Shortcuts
    const S = this.#S;
    let i = this.#i;
    let j = this.#j;

    // Generate keystream word
    let keystreamWord = 0;
    for (let n = 0; n < 4; n++) {
      i = (i + 1) % 256;
      j = (j + S[i]) % 256;

      // Swap
      const t = S[i];
      S[i] = S[j];
      S[j] = t;

      keystreamWord |= S[(S[i] + S[j]) % 256] << (24 - n * 8);
    }

    // Update counters
    this.#i = i;
    this.#j = j;

    return keystreamWord;
  }
}

export default createCipherHelper(RC4);
