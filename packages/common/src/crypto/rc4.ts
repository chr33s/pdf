import { WordArray } from "./word-array.js";

export interface CipherResult {
  ciphertext: WordArray;
}

export interface RC4Static {
  encrypt(message: WordArray, key: WordArray): CipherResult;
  decrypt(ciphertext: WordArray, key: WordArray): CipherResult;
}

function rc4Process(data: Uint8Array, key: Uint8Array): Uint8Array {
  // Key Scheduling Algorithm (KSA)
  const S = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    S[i] = i;
  }

  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) & 0xff;
    // Swap S[i] and S[j]
    const temp = S[i];
    S[i] = S[j];
    S[j] = temp;
  }

  // Pseudo-Random Generation Algorithm (PRGA)
  const result = new Uint8Array(data.length);
  let i = 0;
  j = 0;
  for (let k = 0; k < data.length; k++) {
    i = (i + 1) & 0xff;
    j = (j + S[i]) & 0xff;
    // Swap S[i] and S[j]
    const temp = S[i];
    S[i] = S[j];
    S[j] = temp;
    // Generate keystream byte and XOR with data
    result[k] = data[k] ^ S[(S[i] + S[j]) & 0xff];
  }

  return result;
}

function encrypt(message: WordArray, key: WordArray): CipherResult {
  const keyBytes = key.toUint8Array();
  const messageBytes = message.toUint8Array();
  const encrypted = rc4Process(messageBytes, keyBytes);

  return {
    ciphertext: WordArray.fromUint8Array(encrypted),
  };
}

function decrypt(ciphertext: WordArray, key: WordArray): CipherResult {
  return encrypt(ciphertext, key);
}

export const RC4: RC4Static = {
  encrypt,
  decrypt,
};

export default RC4;
