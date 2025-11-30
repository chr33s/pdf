/**
 * Cipher Feedback block mode.
 */
import { BlockCipherMode, type BlockCipher } from "./cipher-core.js";

/**
 * CFB encryptor mode
 */
class CFBEncryptor extends BlockCipherMode {
  #prevBlock?: number[];

  processBlock(words: number[], offset: number): void {
    const cipher = this._cipher;
    const blockSize = cipher.blockSize;

    this.#generateKeystreamAndEncrypt(words, offset, blockSize, cipher);

    // Remember this block to use with next block
    this.#prevBlock = words.slice(offset, offset + blockSize);
  }

  #generateKeystreamAndEncrypt(
    words: number[],
    offset: number,
    blockSize: number,
    cipher: BlockCipher,
  ): void {
    let keystream: number[];

    // Shortcut
    const iv = this._iv;

    // Generate keystream
    if (iv) {
      keystream = iv.slice(0);
      // Remove IV for subsequent blocks
      this._iv = undefined;
    } else {
      keystream = this.#prevBlock!;
    }
    cipher.encryptBlock(keystream, 0);

    // Encrypt
    for (let i = 0; i < blockSize; i++) {
      words[offset + i] ^= keystream[i];
    }
  }
}

/**
 * CFB decryptor mode
 */
class CFBDecryptor extends BlockCipherMode {
  #prevBlock?: number[];

  processBlock(words: number[], offset: number): void {
    const cipher = this._cipher;
    const blockSize = cipher.blockSize;

    // Remember this block to use with next block
    const thisBlock = words.slice(offset, offset + blockSize);

    this.#generateKeystreamAndEncrypt(words, offset, blockSize, cipher);

    // This block becomes the previous block
    this.#prevBlock = thisBlock;
  }

  #generateKeystreamAndEncrypt(
    words: number[],
    offset: number,
    blockSize: number,
    cipher: BlockCipher,
  ): void {
    let keystream: number[];

    // Shortcut
    const iv = this._iv;

    // Generate keystream
    if (iv) {
      keystream = iv.slice(0);
      // Remove IV for subsequent blocks
      this._iv = undefined;
    } else {
      keystream = this.#prevBlock!;
    }
    cipher.encryptBlock(keystream, 0);

    // Encrypt
    for (let i = 0; i < blockSize; i++) {
      words[offset + i] ^= keystream[i];
    }
  }
}

/**
 * Cipher Feedback block mode.
 */
export const CFB = {
  Encryptor: CFBEncryptor,
  Decryptor: CFBDecryptor,

  createEncryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode {
    const instance = new CFBEncryptor();
    instance.init(cipher, iv);
    return instance;
  },

  createDecryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode {
    const instance = new CFBDecryptor();
    instance.init(cipher, iv);
    return instance;
  },
};
