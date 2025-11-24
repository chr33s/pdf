import { describe, expect, test } from "vitest";

import { PDFHeader } from "../../../src/core/index.js";
import { toCharCode, typedArrayFor } from "../../../src/utils/index.js";

describe("PDFHeader", () => {
  test("can be constructed from PDFHeader.forVersion(...)", () => {
    expect(PDFHeader.forVersion(1, 2)).toBeInstanceOf(PDFHeader);
  });

  test("can be converted to a string", () => {
    expect(String(PDFHeader.forVersion(1, 7))).toBe("%PDF-1.7\n%");
  });

  test("can provide its size in bytes", () => {
    expect(PDFHeader.forVersion(81, 79).sizeInBytes()).toBe(16);
  });

  test("can be serialized", () => {
    const buffer = new Uint8Array(20).fill(toCharCode(" "));
    expect(PDFHeader.forVersion(79, 81).copyBytesInto(buffer, 3)).toBe(16);
    expect(buffer).toEqual(typedArrayFor("   %PDF-79.81\n% "));
  });
});
