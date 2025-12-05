/**
 * Cipher core components.
 */

import { Base64 } from "./base64.js";
import { BufferedBlockAlgorithm, Hasher, Utf8, WordArray, type ConfigObject } from "./core.js";
import { EvpKDF, type EvpKDFConfig } from "./evpkdf.js";

/**
 * Block cipher mode factory interface
 */
interface BlockCipherModeFactory {
  Encryptor: new () => BlockCipherMode;
  Decryptor: new () => BlockCipherMode;
  createEncryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode;
  createDecryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode;
}

/**
 * Cipher configuration
 */
export interface CipherConfig extends ConfigObject {
  iv?: WordArray;
  mode?: BlockCipherModeFactory | typeof CBC;
  padding?: Padding;
  format?: CipherFormat;
  kdf?: KDF;
  hasher?: unknown;
  salt?: WordArray | string;
}

/**
 * Padding interface
 */
export interface Padding {
  pad(data: WordArray, blockSize: number): void;
  unpad(data: WordArray): void;
}

/**
 * Cipher format interface
 */
interface CipherFormat {
  stringify(cipherParams: CipherParams): string;
  parse(str: string): CipherParams;
}

/**
 * KDF interface
 */
interface KDF {
  execute(
    password: string,
    keySize: number,
    ivSize: number,
    salt?: WordArray | string,
    hasher?: unknown,
  ): CipherParams;
}

/**
 * Abstract base cipher template.
 */
export abstract class Cipher extends BufferedBlockAlgorithm {
  static _ENC_XFORM_MODE = 1;
  static _DEC_XFORM_MODE = 2;

  cfg: CipherConfig;
  #xformMode: number;
  #key: WordArray;

  static keySize = 128 / 32;
  static ivSize = 128 / 32;

  protected get _xformMode(): number {
    return this.#xformMode;
  }

  protected get _key(): WordArray {
    return this.#key;
  }

  /**
   * Creates this cipher in encryption mode.
   */
  static createEncryptor<T extends Cipher>(
    this: new (xformMode: number, key: WordArray, cfg?: CipherConfig) => T,
    key: WordArray,
    cfg?: CipherConfig,
  ): T {
    return new this(Cipher._ENC_XFORM_MODE, key, cfg);
  }

  /**
   * Creates this cipher in decryption mode.
   */
  static createDecryptor<T extends Cipher>(
    this: new (xformMode: number, key: WordArray, cfg?: CipherConfig) => T,
    key: WordArray,
    cfg?: CipherConfig,
  ): T {
    return new this(Cipher._DEC_XFORM_MODE, key, cfg);
  }

  constructor(xformMode: number, key: WordArray, cfg?: CipherConfig) {
    super();
    this.cfg = { ...cfg };
    this.#xformMode = xformMode;
    this.#key = key;
    // reset() is called later by subclasses after their fields are initialized
  }

  /**
   * Resets this cipher to its initial state.
   */
  override reset(): void {
    super.reset();
    this._doReset();
  }

  /**
   * Adds data to be encrypted or decrypted.
   */
  process(dataUpdate: WordArray | string): WordArray {
    this._append(dataUpdate);
    return this._process();
  }

  /**
   * Finalizes the encryption or decryption process.
   */
  finalize(dataUpdate?: WordArray | string): WordArray {
    if (dataUpdate) {
      this._append(dataUpdate);
    }
    return this._doFinalize();
  }

  protected abstract _doReset(): void;
  protected abstract _doFinalize(): WordArray;
}

/**
 * Abstract base stream cipher template.
 */
export abstract class StreamCipher extends Cipher {
  override blockSize = 1;

  protected _doFinalize(): WordArray {
    return this._process(true);
  }

  protected abstract _doProcessBlock(M: number[], offset: number): void;
}

/**
 * Block cipher mode interface
 */
interface BlockCipherModeProcessor {
  processBlock(words: number[], offset: number): void;
  init?(cipher: BlockCipher, iv?: number[]): void;
}

/**
 * Abstract base block cipher mode template.
 */
export abstract class BlockCipherMode implements BlockCipherModeProcessor {
  protected _cipher!: BlockCipher;
  protected _iv?: number[];

  static Encryptor: new () => BlockCipherMode;
  static Decryptor: new () => BlockCipherMode;

  static createEncryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode {
    const instance = new this.Encryptor();
    instance.init(cipher, iv);
    return instance;
  }

  static createDecryptor(cipher: BlockCipher, iv?: number[]): BlockCipherMode {
    const instance = new this.Decryptor();
    instance.init(cipher, iv);
    return instance;
  }

  init(cipher: BlockCipher, iv?: number[]): void {
    this._cipher = cipher;
    this._iv = iv;
  }

  abstract processBlock(words: number[], offset: number): void;
}

/**
 * CBC encryptor mode
 */
class CBCEncryptor extends BlockCipherMode {
  #prevBlock?: number[];

  processBlock(words: number[], offset: number): void {
    const cipher = this._cipher;
    const blockSize = cipher.blockSize;

    // XOR and encrypt
    this.#xorBlock(words, offset, blockSize);
    cipher.encryptBlock(words, offset);

    // Remember this block to use with next block
    this.#prevBlock = words.slice(offset, offset + blockSize);
  }

  #xorBlock(words: number[], offset: number, blockSize: number): void {
    let block: number[] | undefined;

    const iv = this._iv;
    if (iv) {
      block = iv;
      this._iv = undefined;
    } else {
      block = this.#prevBlock;
    }

    if (block) {
      for (let i = 0; i < blockSize; i++) {
        words[offset + i] ^= block[i];
      }
    }
  }
}

/**
 * CBC decryptor mode
 */
class CBCDecryptor extends BlockCipherMode {
  #prevBlock?: number[];

  processBlock(words: number[], offset: number): void {
    const cipher = this._cipher;
    const blockSize = cipher.blockSize;

    // Remember this block to use with next block
    const thisBlock = words.slice(offset, offset + blockSize);

    // Decrypt and XOR
    cipher.decryptBlock(words, offset);
    this.#xorBlock(words, offset, blockSize);

    // This block becomes the previous block
    this.#prevBlock = thisBlock;
  }

  #xorBlock(words: number[], offset: number, blockSize: number): void {
    let block: number[] | undefined;

    const iv = this._iv;
    if (iv) {
      block = iv;
      this._iv = undefined;
    } else {
      block = this.#prevBlock;
    }

    if (block) {
      for (let i = 0; i < blockSize; i++) {
        words[offset + i] ^= block[i];
      }
    }
  }
}

/**
 * Cipher Block Chaining mode.
 */
export class CBC extends BlockCipherMode {
  static override Encryptor = CBCEncryptor as unknown as new () => BlockCipherMode;
  static override Decryptor = CBCDecryptor as unknown as new () => BlockCipherMode;

  processBlock(_words: number[], _offset: number): void {
    // This is abstract - use Encryptor or Decryptor
  }
}

/**
 * PKCS #5/7 padding strategy.
 */
export const Pkcs7: Padding = {
  /**
   * Pads data using the algorithm defined in PKCS #5/7.
   */
  pad(data: WordArray, blockSize: number): void {
    const blockSizeBytes = blockSize * 4;
    const nPaddingBytes = blockSizeBytes - (data.sigBytes % blockSizeBytes);
    const paddingWord =
      (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;

    const paddingWords: number[] = [];
    for (let i = 0; i < nPaddingBytes; i += 4) {
      paddingWords.push(paddingWord);
    }
    const padding = new WordArray(paddingWords, nPaddingBytes);

    data.concat(padding);
  },

  /**
   * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
   */
  unpad(data: WordArray): void {
    const nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;
    data.sigBytes -= nPaddingBytes;
  },
};

/**
 * Abstract base block cipher template.
 */
export abstract class BlockCipher extends Cipher {
  override blockSize = 128 / 32;

  declare cfg: CipherConfig & { mode: BlockCipherModeFactory; padding: Padding };

  #mode?: BlockCipherMode;

  constructor(xformMode: number, key: WordArray, cfg?: CipherConfig) {
    super(xformMode, key, {
      mode: CBC,
      padding: Pkcs7,
      ...cfg,
    });
  }

  override reset(): void {
    let modeCreator: (cipher: BlockCipher, iv?: number[]) => BlockCipherMode;

    super.reset();

    const cfg = this.cfg;
    const iv = cfg.iv;
    const mode = cfg.mode;

    if (this._xformMode === Cipher._ENC_XFORM_MODE) {
      modeCreator = mode.createEncryptor.bind(mode);
    } else {
      modeCreator = mode.createDecryptor.bind(mode);
      this._minBufferSize = 1;
    }

    this.#mode = modeCreator(this, iv?.words);
  }

  protected _doProcessBlock(words: number[], offset: number): void {
    this.#mode!.processBlock(words, offset);
  }

  protected _doFinalize(): WordArray {
    const padding = this.cfg.padding;

    if (this._xformMode === Cipher._ENC_XFORM_MODE) {
      padding.pad(this._data, this.blockSize);
      return this._process(true);
    } else {
      const finalProcessedBlocks = this._process(true);
      padding.unpad(finalProcessedBlocks);
      return finalProcessedBlocks;
    }
  }

  abstract encryptBlock(M: number[], offset: number): void;
  abstract decryptBlock(M: number[], offset: number): void;
}

/**
 * A collection of cipher parameters.
 */
export class CipherParams {
  ciphertext?: WordArray;
  key?: WordArray;
  iv?: WordArray;
  salt?: WordArray;
  algorithm?: typeof BlockCipher;
  mode?: typeof BlockCipherMode;
  padding?: Padding;
  blockSize?: number;
  formatter?: CipherFormat;

  constructor(cipherParams?: Partial<CipherParams>) {
    if (cipherParams) {
      Object.assign(this, cipherParams);
    }
  }

  static create(cipherParams?: Partial<CipherParams>): CipherParams {
    return new CipherParams(cipherParams);
  }

  /**
   * Converts this cipher params object to a string.
   */
  toString(formatter?: CipherFormat): string {
    return (formatter || this.formatter || OpenSSLFormatter).stringify(this);
  }
}

/**
 * OpenSSL formatting strategy.
 */
const OpenSSLFormatter: CipherFormat = {
  /**
   * Converts a cipher params object to an OpenSSL-compatible string.
   */
  stringify(cipherParams: CipherParams): string {
    let wordArray: WordArray;

    const ciphertext = cipherParams.ciphertext;
    const salt = cipherParams.salt;

    if (salt) {
      wordArray = new WordArray([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext!);
    } else {
      wordArray = ciphertext!;
    }

    return wordArray.toString(Base64);
  },

  /**
   * Converts an OpenSSL-compatible string to a cipher params object.
   */
  parse(openSSLStr: string): CipherParams {
    let salt: WordArray | undefined;

    const ciphertext = Base64.parse(openSSLStr);
    const ciphertextWords = ciphertext.words;

    if (ciphertextWords[0] === 0x53616c74 && ciphertextWords[1] === 0x65645f5f) {
      salt = new WordArray(ciphertextWords.slice(2, 4));
      ciphertextWords.splice(0, 4);
      ciphertext.sigBytes -= 16;
    }

    return new CipherParams({ ciphertext, salt });
  },
};

/**
 * A cipher wrapper that returns ciphertext as a serializable cipher params object.
 */
const SerializableCipher = {
  cfg: {
    format: OpenSSLFormatter,
  } as { format: CipherFormat },

  /**
   * Encrypts a message.
   */
  encrypt(
    CipherClass: typeof BlockCipher,
    message: WordArray | string,
    key: WordArray,
    cfg?: CipherConfig,
  ): CipherParams {
    const mergedCfg = { ...this.cfg, ...cfg };

    const encryptor = (
      CipherClass as unknown as {
        createEncryptor: (key: WordArray, cfg?: CipherConfig) => BlockCipher;
      }
    ).createEncryptor(key, mergedCfg);
    const ciphertext = encryptor.finalize(message);
    const cipherCfg = encryptor.cfg;

    return new CipherParams({
      ciphertext,
      key,
      iv: cipherCfg.iv,
      algorithm: CipherClass,
      mode: cipherCfg.mode as unknown as typeof BlockCipherMode,
      padding: cipherCfg.padding,
      blockSize: encryptor.blockSize,
      formatter: mergedCfg.format,
    });
  },

  /**
   * Decrypts serialized ciphertext.
   */
  decrypt(
    CipherClass: typeof BlockCipher,
    ciphertext: CipherParams | string,
    key: WordArray,
    cfg?: CipherConfig,
  ): WordArray {
    const mergedCfg = { ...this.cfg, ...cfg };

    const cipherParams = this._parse(ciphertext, mergedCfg.format!);
    const decryptor = (
      CipherClass as unknown as {
        createDecryptor: (key: WordArray, cfg?: CipherConfig) => BlockCipher;
      }
    ).createDecryptor(key, mergedCfg);

    return decryptor.finalize(cipherParams.ciphertext!);
  },

  _parse(ciphertext: CipherParams | string, format: CipherFormat): CipherParams {
    if (typeof ciphertext === "string") {
      return format.parse(ciphertext);
    } else {
      return ciphertext;
    }
  },
};

/**
 * OpenSSL key derivation function.
 */
const OpenSSLKdf: KDF = {
  /**
   * Derives a key and IV from a password.
   */
  execute(
    password: string,
    keySize: number,
    ivSize: number,
    salt?: WordArray | string,
    hasher?: unknown,
  ): CipherParams {
    let actualSalt: WordArray;
    if (!salt) {
      actualSalt = WordArray.random(64 / 8);
    } else if (typeof salt === "string") {
      actualSalt = Utf8.parse(salt);
    } else {
      actualSalt = salt;
    }

    const cfg: EvpKDFConfig = { keySize: keySize + ivSize };
    if (hasher) {
      cfg.hasher = hasher as typeof Hasher;
    }

    const key = new EvpKDF(cfg).compute(password, actualSalt);

    const iv = new WordArray(key.words.slice(keySize), ivSize * 4);
    key.sigBytes = keySize * 4;

    return new CipherParams({ key, iv, salt: actualSalt });
  },
};

/**
 * A serializable cipher wrapper that derives the key from a password.
 */
const PasswordBasedCipher = {
  cfg: {
    ...SerializableCipher.cfg,
    kdf: OpenSSLKdf,
  } as { format: CipherFormat; kdf: KDF },

  /**
   * Encrypts a message using a password.
   */
  encrypt(
    CipherClass: typeof BlockCipher,
    message: WordArray | string,
    password: string,
    cfg?: CipherConfig,
  ): CipherParams {
    const mergedCfg = { ...this.cfg, ...cfg };

    const derivedParams = mergedCfg.kdf!.execute(
      password,
      CipherClass.keySize,
      CipherClass.ivSize,
      mergedCfg.salt,
      mergedCfg.hasher,
    );

    const cipherCfg = { ...mergedCfg, iv: derivedParams.iv };
    const ciphertext = SerializableCipher.encrypt(
      CipherClass,
      message,
      derivedParams.key!,
      cipherCfg,
    );

    ciphertext.salt = derivedParams.salt;
    ciphertext.key = undefined; // Don't include derived key in output

    return ciphertext;
  },

  /**
   * Decrypts serialized ciphertext using a password.
   */
  decrypt(
    CipherClass: typeof BlockCipher,
    ciphertext: CipherParams | string,
    password: string,
    cfg?: CipherConfig,
  ): WordArray {
    const mergedCfg = { ...this.cfg, ...cfg };

    const cipherParams = SerializableCipher._parse(ciphertext, mergedCfg.format!);

    const derivedParams = mergedCfg.kdf!.execute(
      password,
      CipherClass.keySize,
      CipherClass.ivSize,
      cipherParams.salt,
      mergedCfg.hasher,
    );

    const decryptCfg = { ...mergedCfg, iv: derivedParams.iv };

    return SerializableCipher.decrypt(CipherClass, cipherParams, derivedParams.key!, decryptCfg);
  },
};

/**
 * Creates shortcut functions to a cipher's object interface.
 */
export function createCipherHelper(CipherClass: typeof BlockCipher | typeof StreamCipher) {
  return {
    encrypt(
      message: WordArray | string,
      key: WordArray | string,
      cfg?: CipherConfig,
    ): CipherParams {
      if (typeof key === "string") {
        return PasswordBasedCipher.encrypt(CipherClass as typeof BlockCipher, message, key, cfg);
      } else {
        return SerializableCipher.encrypt(CipherClass as typeof BlockCipher, message, key, cfg);
      }
    },

    decrypt(
      ciphertext: CipherParams | string,
      key: WordArray | string,
      cfg?: CipherConfig,
    ): WordArray {
      if (typeof key === "string") {
        return PasswordBasedCipher.decrypt(CipherClass as typeof BlockCipher, ciphertext, key, cfg);
      } else {
        return SerializableCipher.decrypt(CipherClass as typeof BlockCipher, ciphertext, key, cfg);
      }
    },
  };
}
