/**
 * Counter block mode.
 */
import { BlockCipherMode, type BlockCipher } from "./cipher-core.js";

/**
 * CTR encryptor/decryptor mode (same for both)
 */
class CTRProcessor extends BlockCipherMode {
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
    const keystream = counter!.slice(0);
    cipher.encryptBlock(keystream, 0);

    // Increment counter
    counter![blockSize - 1] = (counter![blockSize - 1] + 1) | 0;

    // Encrypt/Decrypt
    for (let i = 0; i < blockSize; i++) {
      words[offset + i] ^= keystream[i];
    }
  }
}

/**
 * Counter block mode.
 */
export const CTR = {
  Encryptor: CTRProcessor,
  Decryptor: CTRProcessor,

  createEncryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode {
    const instance = new CTRProcessor();
    instance.init(cipher, iv);
    return instance;
  },

  createDecryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode {
    const instance = new CTRProcessor();
    instance.init(cipher, iv);
    return instance;
  },
};
