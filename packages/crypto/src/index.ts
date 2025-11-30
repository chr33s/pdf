/**
 * CryptoJS - JavaScript library of crypto standards.
 * Converted to TypeScript ES6 ESM.
 */

// Core
export { BufferedBlockAlgorithm, Hasher, Hex, Latin1, Utf8, WordArray, enc, lib } from "./core.js";
export type { ConfigObject, Encoder, HasherConfig } from "./core.js";

// x64 core
export { X64Word, X64WordArray, x64 } from "./x64-core.js";

// Typed arrays support
export {
  supportsTypedArrays,
  typedArrayToWordArray,
  wordArrayFromTypedArray,
  wordArrayToTypedArray,
} from "./lib-typedarrays.js";

// Encoders
export { Base64 } from "./enc-base64.js";
export { Base64url } from "./enc-base64url.js";
export { Utf16, Utf16BE, Utf16LE } from "./enc-utf16.js";

// HMAC
export { HMAC, createHmacHelper } from "./hmac.js";
export type { HasherClass } from "./hmac.js";

// Hash algorithms
export { HmacMD5, MD5, md5 } from "./md5.js";
export { HmacRIPEMD160, RIPEMD160, ripemd160 } from "./ripemd160.js";
export { HmacSHA1, SHA1, sha1 } from "./sha1.js";
export { HmacSHA224, SHA224, sha224 } from "./sha224.js";
export { HmacSHA256, SHA256, sha256 } from "./sha256.js";
export { HmacSHA3, SHA3, sha3 } from "./sha3.js";
export type { SHA3Config } from "./sha3.js";
export { HmacSHA384, SHA384, sha384 } from "./sha384.js";
export { HmacSHA512, SHA512, sha512 } from "./sha512.js";

// Key derivation
export { EvpKDF, evpKDF } from "./evpkdf.js";
export type { EvpKDFConfig } from "./evpkdf.js";
export { PBKDF2, pbkdf2 } from "./pbkdf2.js";
export type { PBKDF2Config } from "./pbkdf2.js";

// Cipher core
export {
  BlockCipher,
  BlockCipherMode,
  CBC,
  Cipher,
  CipherParams,
  OpenSSLFormatter,
  OpenSSLKdf,
  PasswordBasedCipher,
  Pkcs7,
  SerializableCipher,
  StreamCipher,
  createCipherHelper,
} from "./cipher-core.js";
export type { CipherConfig, CipherFormat, KDF, Padding } from "./cipher-core.js";

// Ciphers
export { AES, AESHelper } from "./aes.js";
export { Blowfish, BlowfishHelper } from "./blowfish.js";
export { RabbitLegacy, RabbitLegacyHelper } from "./rabbit-legacy.js";
export { Rabbit, RabbitHelper } from "./rabbit.js";
export { RC4, RC4Drop, RC4DropHelper, RC4Helper } from "./rc4.js";
export type { RC4DropConfig } from "./rc4.js";
export { DES, DESHelper, TripleDES, TripleDESHelper } from "./tripledes.js";

// Cipher modes
export { CFB } from "./mode-cfb.js";
export { CTRGladman } from "./mode-ctr-gladman.js";
export { CTR } from "./mode-ctr.js";
export { ECB } from "./mode-ecb.js";
export { OFB } from "./mode-ofb.js";

// Padding schemes
export { AnsiX923 } from "./pad-ansix923.js";
export { Iso10126 } from "./pad-iso10126.js";
export { Iso97971 } from "./pad-iso97971.js";
export { NoPadding } from "./pad-nopadding.js";
export { ZeroPadding } from "./pad-zeropadding.js";

// Formats
export { HexFormatter } from "./format-hex.js";

// Default export - CryptoJS-like namespace
import { AES, AESHelper } from "./aes.js";
import { Blowfish, BlowfishHelper } from "./blowfish.js";
import {
  CBC,
  CipherParams,
  OpenSSLFormatter,
  OpenSSLKdf,
  PasswordBasedCipher,
  Pkcs7,
  SerializableCipher,
} from "./cipher-core.js";
import { Hex, Latin1, Utf8, WordArray, enc, lib } from "./core.js";
import { Base64 } from "./enc-base64.js";
import { Base64url } from "./enc-base64url.js";
import { Utf16, Utf16BE, Utf16LE } from "./enc-utf16.js";
import { EvpKDF, evpKDF } from "./evpkdf.js";
import { HMAC } from "./hmac.js";
import { HmacMD5, MD5, md5 } from "./md5.js";
import { ECB } from "./mode-ecb.js";
import { NoPadding } from "./pad-nopadding.js";
import { RabbitLegacy, RabbitLegacyHelper } from "./rabbit-legacy.js";
import { Rabbit, RabbitHelper } from "./rabbit.js";
import { RC4Helper } from "./rc4.js";
import { HmacSHA1, SHA1, sha1 } from "./sha1.js";
import { HmacSHA256, SHA256, sha256 } from "./sha256.js";
import { HmacSHA512, SHA512, sha512 } from "./sha512.js";
import { DES, DESHelper, TripleDES, TripleDESHelper } from "./tripledes.js";
import { X64Word, X64WordArray, x64 } from "./x64-core.js";

const CryptoJS = {
  // Core
  lib: {
    ...lib,
    WordArray,
  },
  enc: {
    ...enc,
    Hex,
    Latin1,
    Utf8,
    Base64,
    Base64url,
    Utf16,
    Utf16BE,
    Utf16LE,
  },
  x64: {
    ...x64,
    Word: X64Word,
    WordArray: X64WordArray,
  },

  // Algorithms
  algo: {
    MD5,
    SHA1,
    SHA256,
    SHA512,
    HMAC,
    EvpKDF,
    AES,
    Blowfish,
    DES,
    TripleDES,
    Rabbit,
    RabbitLegacy,
  },

  // Shortcut functions
  MD5: md5,
  SHA1: sha1,
  SHA256: sha256,
  SHA512: sha512,
  HmacMD5,
  HmacSHA1,
  HmacSHA256,
  HmacSHA512,
  EvpKDF: evpKDF,
  AES: AESHelper,
  Blowfish: BlowfishHelper,
  DES: DESHelper,
  TripleDES: TripleDESHelper,
  Rabbit: RabbitHelper,
  RabbitLegacy: RabbitLegacyHelper,
  RC4: RC4Helper,

  // Cipher support
  mode: {
    CBC: CBC as typeof CBC,
    ECB: ECB as typeof ECB,
  },
  pad: {
    Pkcs7,
    NoPadding,
  },
  format: {
    OpenSSL: OpenSSLFormatter,
  },
  kdf: {
    OpenSSL: OpenSSLKdf,
  },

  // Utilities
  CipherParams,
  SerializableCipher,
  PasswordBasedCipher,
};

export default CryptoJS;
