import { deflate } from "@chr33s/pdf-compression";
import { describe, expect, test } from "vitest";

import {
  mergeIntoTypedArray,
  PDFContext,
  PDFCrossRefStream,
  PDFRef,
  toCharCode,
} from "../../../src/index.js";

describe("PDFCrossRefStream", () => {
  const context = PDFContext.create();
  const dict = context.obj({});

  function createStream1(encode = false) {
    const stream = PDFCrossRefStream.create(dict, encode);
    stream.addDeletedEntry(PDFRef.of(1, 2), 11);
    stream.addUncompressedEntry(PDFRef.of(2, 40), 30);
    stream.addCompressedEntry(PDFRef.of(21), PDFRef.of(5), 691);
    return stream;
  }

  function createStream2(encode = false) {
    const stream = PDFCrossRefStream.create(dict, encode);
    stream.addUncompressedEntry(PDFRef.of(2), 300);
    stream.addCompressedEntry(PDFRef.of(3), PDFRef.of(10), 0);
    stream.addUncompressedEntry(PDFRef.of(9000), 600);
    stream.addCompressedEntry(PDFRef.of(9001), PDFRef.of(10), 1);
    return stream;
  }

  test("can be constructed from PDFCrossRefStream.create(...)", () => {
    expect(PDFCrossRefStream.create(dict, false)).toBeInstanceOf(PDFCrossRefStream);
  });

  test("can be cloned", async () => {
    const original = createStream1();
    await original.init();
    const clone = original.clone();
    await clone.init();
    expect(clone).not.toBe(original);
    expect(String(clone)).toBe(String(original));
  });

  test("can be converted to a string", async () => {
    const stream1 = createStream1();
    await stream1.init();
    // The stream content is binary data, so we just verify the header format
    const str = String(stream1);
    expect(str).toContain("/Type /XRef");
    expect(str).toContain("/Length 16");
    expect(str).toContain("/W [ 1 1 2 ]");
    expect(str).toContain("/Index [ 0 3 21 1 ]");
    expect(str).toContain("stream\n");
    expect(str).toContain("\nendstream");
  });

  test("can be converted to a string without object number 1", async () => {
    const stream2 = createStream2();
    await stream2.init();
    const str = String(stream2);
    expect(str).toContain("/Type /XRef");
    expect(str).toContain("/Length 25");
    expect(str).toContain("/W [ 1 2 2 ]");
    expect(str).toContain("/Index [ 0 1 2 2 9000 2 ]");
    expect(str).toContain("stream\n");
    expect(str).toContain("\nendstream");
  });

  test("can provide its size in bytes", async () => {
    const stream1 = createStream1();
    await stream1.init();
    expect(stream1.sizeInBytes()).toBe(95);
  });

  test("can provide its size in bytes without object number 1", async () => {
    const stream2 = createStream2();
    await stream2.init();
    expect(stream2.sizeInBytes()).toBe(110);
  });

  test("can be serialized", async () => {
    const stream1 = createStream1();
    await stream1.init();
    const buffer = new Uint8Array(stream1.sizeInBytes() + 3).fill(toCharCode(" "));

    // prettier-ignore
    const expectedEntries = new Uint8Array([
      0,  0, 255, 255,
      0, 11,   0,   2,
      1, 30,   0,  40,
      2,  5,   2, 179,
    ]);

    expect(stream1.copyBytesInto(buffer, 2)).toBe(95);
    expect(buffer).toEqual(
      mergeIntoTypedArray(
        "  <<\n/Type /XRef\n/Length 16\n/W [ 1 1 2 ]\n/Index [ 0 3 21 1 ]\n>>\n",
        "stream\n",
        expectedEntries,
        "\nendstream ",
      ),
    );
  });

  test("can be serialized without object number 1", async () => {
    const stream2 = createStream2();
    await stream2.init();
    const buffer = new Uint8Array(stream2.sizeInBytes() + 3).fill(toCharCode(" "));

    // prettier-ignore
    const expectedEntries = new Uint8Array([
      0,  0,   0,  255,  255,
      1,  1,  44,    0,    0,
      2,  0,  10,    0,    0,
      1,  2,  88,    0,    0,
      2,  0,  10,    0,    1,
    ]);

    expect(stream2.copyBytesInto(buffer, 2)).toBe(110);
    expect(buffer).toEqual(
      mergeIntoTypedArray(
        "  <<\n/Type /XRef\n/Length 25\n/W [ 1 2 2 ]\n/Index [ 0 1 2 2 9000 2 ]\n>>\n",
        "stream\n",
        expectedEntries,
        "\nendstream ",
      ),
    );
  });

  test("can be serialized when encoded", async () => {
    const stream = createStream2(true);
    await stream.init();

    const buffer = new Uint8Array(stream.sizeInBytes() + 3).fill(toCharCode(" "));

    // prettier-ignore
    const expectedEntries = new Uint8Array([
      0,  0,   0,  255,  255,
      1,  1,  44,    0,    0,
      2,  0,  10,    0,    0,
      1,  2,  88,    0,    0,
      2,  0,  10,    0,    1,
    ]);
    const encodedEntries = await deflate(expectedEntries);

    expect(stream.copyBytesInto(buffer, 2)).toBe(135);
    expect(buffer).toEqual(
      mergeIntoTypedArray(
        "  <<\n/Type /XRef\n/Length 29\n/W [ 1 2 2 ]\n/Index [ 0 1 2 2 9000 2 ]\n/Filter /FlateDecode\n>>\n",
        "stream\n",
        encodedEntries,
        "\nendstream ",
      ),
    );
  });
});
