import { describe, expect, test } from "vitest";

import { MethodNotImplementedError, PDFObject } from "../../../src/core/index.js";

describe("PDFObject", () => {
  const pdfObject = new PDFObject();

  test("does not implement clone()", () => {
    expect(() => pdfObject.clone()).toThrow(new MethodNotImplementedError(PDFObject.name, "clone"));
  });

  test("does not implement toString()", () => {
    expect(() => pdfObject.toString()).toThrow(
      new MethodNotImplementedError(PDFObject.name, "toString"),
    );
  });

  test("does not implement sizeInBytes()", () => {
    expect(() => pdfObject.sizeInBytes()).toThrow(
      new MethodNotImplementedError(PDFObject.name, "sizeInBytes"),
    );
  });

  test("does not implement copyBytesInto()", () => {
    expect(() => pdfObject.copyBytesInto(new Uint8Array(), 0)).toThrow(
      new MethodNotImplementedError(PDFObject.name, "copyBytesInto"),
    );
  });
});
