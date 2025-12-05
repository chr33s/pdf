import { Buffer } from "node:buffer";
import { createCipheriv, createDecipheriv } from "node:crypto";
import type { Mode } from "./mode.js";
import { CBC } from "./mode.js";
import type { Padding } from "./padding.js";
import { Pkcs7 } from "./padding.js";
import { WordArray } from "./word-array.js";

export interface CipherResult {
  ciphertext: WordArray;
}

export interface AESOptions {
  mode?: Mode;
  padding?: Padding;
  iv?: WordArray;
}

export interface AESStatic {
  encrypt(message: WordArray, key: WordArray, options?: AESOptions): CipherResult;
  decrypt(ciphertext: WordArray, key: WordArray, options?: AESOptions): CipherResult;
}

function getAlgorithm(keyBytes: Uint8Array, mode: Mode): string {
  const keyBits = keyBytes.length * 8;
  const modeName = mode.name.toLowerCase();
  return `aes-${keyBits}-${modeName}`;
}

/**
 * AES encryption using node:crypto
 */
function encrypt(message: WordArray, key: WordArray, options: AESOptions = {}): CipherResult {
  const mode = options.mode || CBC;
  const padding = options.padding || Pkcs7;

  const keyBytes = key.toUint8Array();
  const algorithm = getAlgorithm(keyBytes, mode);

  // Clone and pad the message
  const paddedMessage = message.clone();
  padding.pad(paddedMessage, 4); // AES block size is 4 words (16 bytes)
  const messageBytes = paddedMessage.toUint8Array();

  // Get IV (for CBC mode)
  let iv: Uint8Array | null = null;
  if (mode === CBC) {
    iv = options.iv ? options.iv.toUint8Array() : new Uint8Array(16);
  }

  const cipher = createCipheriv(algorithm, keyBytes, iv);
  cipher.setAutoPadding(false); // We handle padding ourselves

  const encrypted = Buffer.concat([cipher.update(messageBytes), cipher.final()]);

  return {
    ciphertext: WordArray.fromUint8Array(new Uint8Array(encrypted)),
  };
}

/**
 * AES decryption using node:crypto
 */
function decrypt(ciphertext: WordArray, key: WordArray, options: AESOptions = {}): CipherResult {
  const mode = options.mode || CBC;
  const padding = options.padding || Pkcs7;

  const keyBytes = key.toUint8Array();
  const algorithm = getAlgorithm(keyBytes, mode);
  const ciphertextBytes = ciphertext.toUint8Array();

  // Get IV (for CBC mode)
  let iv: Uint8Array | null = null;
  if (mode === CBC) {
    iv = options.iv ? options.iv.toUint8Array() : new Uint8Array(16);
  }

  const decipher = createDecipheriv(algorithm, keyBytes, iv);
  decipher.setAutoPadding(false); // We handle padding ourselves

  const decrypted = Buffer.concat([decipher.update(ciphertextBytes), decipher.final()]);
  const result = WordArray.fromUint8Array(new Uint8Array(decrypted));

  padding.unpad(result);

  return {
    ciphertext: result,
  };
}

export const AES: AESStatic = {
  encrypt,
  decrypt,
};

export default AES;
