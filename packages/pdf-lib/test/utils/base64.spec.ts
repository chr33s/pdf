import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { decodeFromBase64DataUri } from "../../src/utils/index.js";

const pdfBytes = fs.readFileSync(new URL("./data/simple.pdf", import.meta.url));
const pdfBase64Bytes = fs.readFileSync(
  new URL("./data/simple.pdf.base64", import.meta.url),
);
const pdfBase64String = pdfBase64Bytes.toString();

// Jest stalls when comparing large arrays, so we'll use this instead
const arraysAreEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false;
  for (let idx = 0, len = a.length; idx < len; idx++) {
    if (a[idx] !== b[idx]) return false;
  }
  return true;
};

describe("decodeFromBase64DataUri", () => {
  it("can decode plain base64 strings", () => {
    const uri = pdfBase64String;
    expect(arraysAreEqual(decodeFromBase64DataUri(uri), pdfBytes)).toBe(true);
  });

  it("can decode complete data URIs", () => {
    const uri = `data:application/pdf;base64,${pdfBase64String}`;
    expect(arraysAreEqual(decodeFromBase64DataUri(uri), pdfBytes)).toBe(true);
  });

  it("can decode partial data URIs (1)", () => {
    const uri = `data:application/pdf;,${pdfBase64String}`;
    expect(arraysAreEqual(decodeFromBase64DataUri(uri), pdfBytes)).toBe(true);
  });

  it("can decode partial data URIs (2)", () => {
    const uri = `data:;,${pdfBase64String}`;
    expect(arraysAreEqual(decodeFromBase64DataUri(uri), pdfBytes)).toBe(true);
  });

  it("can decode partial data URIs (3)", () => {
    const uri = `data:application/pdf;,${pdfBase64String}`;
    expect(arraysAreEqual(decodeFromBase64DataUri(uri), pdfBytes)).toBe(true);
  });

  it("can decode partial data URIs (4)", () => {
    const uri = `:;,${pdfBase64String}`;
    expect(arraysAreEqual(decodeFromBase64DataUri(uri), pdfBytes)).toBe(true);
  });

  it("can decode partial data URIs (5)", () => {
    const uri = `;,${pdfBase64String}`;
    expect(arraysAreEqual(decodeFromBase64DataUri(uri), pdfBytes)).toBe(true);
  });

  it("can decode partial data URIs (6)", () => {
    const uri = `,${pdfBase64String}`;
    expect(arraysAreEqual(decodeFromBase64DataUri(uri), pdfBytes)).toBe(true);
  });

  it("can throws an error when it fails to parse the URI", () => {
    const uri = {} as any;
    expect(() => decodeFromBase64DataUri(uri)).toThrow();
  });
});
