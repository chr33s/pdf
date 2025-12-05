import { Buffer } from "node:buffer";
import { describe, expect, test } from "vitest";
import {
  base64,
  decodeFromBase64,
  decodeFromBase64DataUri,
  encodeToBase64,
} from "../src/base64.js";

describe("encodeToBase64", () => {
  test("matches Node.js Buffer encoding for simple data", () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = encodeToBase64(data);
    const expected = Buffer.from(data).toString("base64");
    expect(result).toBe(expected);
  });

  test("matches Node.js Buffer encoding for binary data", () => {
    const data = new Uint8Array([0, 1, 2, 255, 254, 253, 128, 64, 32]);
    const result = encodeToBase64(data);
    const expected = Buffer.from(data).toString("base64");
    expect(result).toBe(expected);
  });

  test("matches Node.js Buffer encoding with padding (1 byte)", () => {
    const data = new Uint8Array([65]); // requires == padding
    const result = encodeToBase64(data);
    const expected = Buffer.from(data).toString("base64");
    expect(result).toBe(expected);
  });

  test("matches Node.js Buffer encoding with padding (2 bytes)", () => {
    const data = new Uint8Array([65, 66]); // requires = padding
    const result = encodeToBase64(data);
    const expected = Buffer.from(data).toString("base64");
    expect(result).toBe(expected);
  });

  test("matches Node.js Buffer encoding with no padding (3 bytes)", () => {
    const data = new Uint8Array([65, 66, 67]); // no padding needed
    const result = encodeToBase64(data);
    const expected = Buffer.from(data).toString("base64");
    expect(result).toBe(expected);
  });

  test("matches Node.js Buffer encoding for empty data", () => {
    const data = new Uint8Array([]);
    const result = encodeToBase64(data);
    const expected = Buffer.from(data).toString("base64");
    expect(result).toBe(expected);
  });

  test("matches Node.js Buffer encoding for large data", () => {
    const data = new Uint8Array(1000);
    for (let i = 0; i < data.length; i++) data[i] = i % 256;
    const result = encodeToBase64(data);
    const expected = Buffer.from(data).toString("base64");
    expect(result).toBe(expected);
  });
});

describe("decodeFromBase64", () => {
  test("matches Node.js Buffer decoding for simple data", () => {
    const base64 = "SGVsbG8="; // "Hello"
    const result = decodeFromBase64(base64);
    const expected = new Uint8Array(Buffer.from(base64, "base64"));
    expect(result).toEqual(expected);
  });

  test("matches Node.js Buffer decoding for binary data", () => {
    const base64 = "AAEC//79gEAg";
    const result = decodeFromBase64(base64);
    const expected = new Uint8Array(Buffer.from(base64, "base64"));
    expect(result).toEqual(expected);
  });

  test("matches Node.js Buffer decoding with double padding", () => {
    const base64 = "QQ==";
    const result = decodeFromBase64(base64);
    const expected = new Uint8Array(Buffer.from(base64, "base64"));
    expect(result).toEqual(expected);
  });

  test("matches Node.js Buffer decoding with single padding", () => {
    const base64 = "QUI=";
    const result = decodeFromBase64(base64);
    const expected = new Uint8Array(Buffer.from(base64, "base64"));
    expect(result).toEqual(expected);
  });

  test("matches Node.js Buffer decoding with no padding", () => {
    const base64 = "QUJD";
    const result = decodeFromBase64(base64);
    const expected = new Uint8Array(Buffer.from(base64, "base64"));
    expect(result).toEqual(expected);
  });

  test("matches Node.js Buffer decoding for empty string", () => {
    const base64 = "";
    const result = decodeFromBase64(base64);
    const expected = new Uint8Array(Buffer.from(base64, "base64"));
    expect(result).toEqual(expected);
  });

  test("roundtrip encode/decode matches original data", () => {
    const original = new Uint8Array([0, 127, 255, 1, 254, 128]);
    const encoded = encodeToBase64(original);
    const decoded = decodeFromBase64(encoded);
    expect(decoded).toEqual(original);
  });
});

describe("decodeFromBase64DataUri", () => {
  const testData = new Uint8Array([37, 80, 68, 70]); // %PDF
  const base64String = Buffer.from(testData).toString("base64");

  test("can decode plain base64 strings", () => {
    const result = decodeFromBase64DataUri(base64String);
    expect(result).toEqual(testData);
  });

  test("can decode complete data URIs", () => {
    const uri = `data:application/pdf;base64,${base64String}`;
    const result = decodeFromBase64DataUri(uri);
    expect(result).toEqual(testData);
  });

  test("can decode data URI without base64 marker", () => {
    const uri = `data:application/pdf;,${base64String}`;
    const result = decodeFromBase64DataUri(uri);
    expect(result).toEqual(testData);
  });

  test("can decode data URI without mime type", () => {
    const uri = `data:;,${base64String}`;
    const result = decodeFromBase64DataUri(uri);
    expect(result).toEqual(testData);
  });

  test("can decode minimal data URI", () => {
    const uri = `,${base64String}`;
    const result = decodeFromBase64DataUri(uri);
    expect(result).toEqual(testData);
  });

  test("throws an error for invalid input", () => {
    const uri = {} as any;
    expect(() => decodeFromBase64DataUri(uri)).toThrow();
  });
});

describe("encode/decode (base64-arraybuffer compatible)", () => {
  test("encode matches Node.js Buffer encoding", () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
    const result = base64.encode(data);
    const expected = Buffer.from(new Uint8Array(data)).toString("base64");
    expect(result).toBe(expected);
  });

  test("decode returns ArrayBuffer", () => {
    const encoded = "SGVsbG8=";
    const result = base64.decode(encoded);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(result)).toEqual(new Uint8Array(Buffer.from(encoded, "base64")));
  });

  test("roundtrip encode/decode with ArrayBuffer", () => {
    const original = new Uint8Array([0, 127, 255, 1, 254, 128]).buffer;
    const encoded = base64.encode(original);
    const decoded = base64.decode(encoded);
    expect(new Uint8Array(decoded)).toEqual(new Uint8Array(original));
  });
});
