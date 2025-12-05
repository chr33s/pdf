import { Buffer } from "node:buffer";

export const encodeToBase64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString("base64");

export const decodeFromBase64 = (base64: string): Uint8Array =>
  new Uint8Array(Buffer.from(base64, "base64"));

// This regex is designed to be as flexible as possible. It will parse certain invalid data URIs.
const DATA_URI_PREFIX_REGEX = /^(data)?:?([\w/+]+)?;?(charset=[\w-]+|base64)?.*,/i;

export const decodeFromBase64DataUri = (dataUri: string): Uint8Array => {
  const trimmedUri = dataUri.trim();

  const prefix = trimmedUri.substring(0, 100);
  const res = prefix.match(DATA_URI_PREFIX_REGEX);

  // Assume it's not a data URI - just a plain base64 string
  if (!res) return decodeFromBase64(trimmedUri);

  // Remove the data URI prefix and parse the remainder as a base64 string
  const [fullMatch] = res;
  const data = trimmedUri.substring(fullMatch.length);

  return decodeFromBase64(data);
};

const encode = (arrayBuffer: ArrayBuffer): string => encodeToBase64(new Uint8Array(arrayBuffer));

const decode = (base64: string): ArrayBuffer => {
  const bytes = decodeFromBase64(base64);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};

export const base64 = { encode, decode };
