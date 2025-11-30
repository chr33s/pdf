/**
 * Output Feedback block mode.
 */
import { BlockCipherMode, type BlockCipher } from "./cipher-core.js";

/**
 * OFB encryptor/decryptor mode (same for both)
 */
class OFBProcessor extends BlockCipherMode {
  #keystream?: number[];

  processBlock(words: number[], offset: number): void {
    const cipher = this._cipher;
    const blockSize = cipher.blockSize;
    const iv = this._iv;
    let keystream = this.#keystream;

    // Generate keystream
    if (iv) {
      keystream = this.#keystream = iv.slice(0);
      // Remove IV for subsequent blocks
      this._iv = undefined;
    }
    cipher.encryptBlock(keystream!, 0);

    // Encrypt/Decrypt
    for (let i = 0; i < blockSize; i++) {
      words[offset + i] ^= keystream![i];
    }
  }
}

/**
 * Output Feedback block mode.
 */
export const OFB = {
  Encryptor: OFBProcessor,
  Decryptor: OFBProcessor,

  createEncryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode {
    const instance = new OFBProcessor();
    instance.init(cipher, iv);
    return instance;
  },

  createDecryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode {
    const instance = new OFBProcessor();
    instance.init(cipher, iv);
    return instance;
  },
};
