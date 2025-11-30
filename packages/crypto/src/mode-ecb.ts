/**
 * Electronic Codebook block mode.
 */
import { BlockCipherMode, type BlockCipher } from "./cipher-core.js";

/**
 * ECB encryptor mode
 */
class ECBEncryptor extends BlockCipherMode {
  processBlock(words: number[], offset: number): void {
    this._cipher.encryptBlock(words, offset);
  }
}

/**
 * ECB decryptor mode
 */
class ECBDecryptor extends BlockCipherMode {
  processBlock(words: number[], offset: number): void {
    this._cipher.decryptBlock(words, offset);
  }
}

/**
 * Electronic Codebook block mode.
 */
export const ECB = {
  Encryptor: ECBEncryptor,
  Decryptor: ECBDecryptor,

  createEncryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode {
    const instance = new ECBEncryptor();
    instance.init(cipher, iv);
    return instance;
  },

  createDecryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode {
    const instance = new ECBDecryptor();
    instance.init(cipher, iv);
    return instance;
  },
};
