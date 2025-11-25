import { describe, expect, test } from "vitest";

import { PDFNull } from "../../../src/core/index.js";
import { toCharCode, typedArrayFor } from "../../../src/utils/index.js";

describe("PDFNull", () => {
  test("cannot be publicly constructed", () => {
    expect(() => new (PDFNull as any)()).toThrow();
  });

  test("can be converted to null", () => {
    expect(PDFNull.asNull()).toBe(null);
  });

  test("can be cloned", () => {
    expect(PDFNull.clone()).toBe(PDFNull);
  });

  test("can be converted to a string", () => {
    expect(String(PDFNull)).toBe("null");
  });

  test("can provide its size in bytes", () => {
    expect(PDFNull.sizeInBytes()).toBe(4);
  });

  test("can be serialized", () => {
    const buffer = new Uint8Array(8).fill(toCharCode(" "));
    expect(PDFNull.copyBytesInto(buffer, 3)).toBe(4);
    expect(buffer).toEqual(typedArrayFor("   null "));
  });
});
