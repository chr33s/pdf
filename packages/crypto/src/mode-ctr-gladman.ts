/**
 * Counter block mode compatible with Dr Brian Gladman fileenc.c
 * derived from CryptoJS.mode.CTR
 * Jan Hruby jhruby.web@gmail.com
 */
import { BlockCipherMode, type BlockCipher } from "./cipher-core.js";

function incWord(word: number): number {
  if (((word >> 24) & 0xff) === 0xff) {
    // overflow
    let b1 = (word >> 16) & 0xff;
    let b2 = (word >> 8) & 0xff;
    let b3 = word & 0xff;

    if (b1 === 0xff) {
      // overflow b1
      b1 = 0;
      if (b2 === 0xff) {
        b2 = 0;
        if (b3 === 0xff) {
          b3 = 0;
        } else {
          ++b3;
        }
      } else {
        ++b2;
      }
    } else {
      ++b1;
    }

    word = 0;
    word += b1 << 16;
    word += b2 << 8;
    word += b3;
  } else {
    word += 0x01 << 24;
  }
  return word;
}

function incCounter(counter: number[]): number[] {
  counter[0] = incWord(counter[0]);
  if (counter[0] === 0) {
    // encr_data in fileenc.c from Dr Brian Gladman's counts only with DWORD j < 8
    counter[1] = incWord(counter[1]);
  }
  return counter;
}

/**
 * CTR-Gladman encryptor/decryptor mode processor.
 */
class CTRGladmanProcessor extends BlockCipherMode {
  #counter?: number[];

  processBlock(words: number[], offset: number): void {
    const cipher = this._cipher;
    const blockSize = cipher.blockSize;
    const iv = this._iv;
    let counter = this.#counter;

    // Generate keystream
    if (iv) {
      counter = this.#counter = iv.slice(0);
      // Remove IV for subsequent blocks
      this._iv = undefined;
    }

    incCounter(counter!);

    const keystream = counter!.slice(0);
    cipher.encryptBlock(keystream, 0);

    // Encrypt/Decrypt
    for (let i = 0; i < blockSize; i++) {
      words[offset + i] ^= keystream[i];
    }
  }
}

/**
 * Counter block mode compatible with Dr Brian Gladman fileenc.c.
 */
export const CTRGladman = {
  Encryptor: CTRGladmanProcessor,
  Decryptor: CTRGladmanProcessor,

  createEncryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode {
    const instance = new CTRGladmanProcessor();
    instance.init(cipher, iv);
    return instance;
  },

  createDecryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode {
    const instance = new CTRGladmanProcessor();
    instance.init(cipher, iv);
    return instance;
  },
};
