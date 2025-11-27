import { describe, expect, test } from "vitest";

import {
  PDFContext,
  PDFHexString,
  PDFObject,
  PDFObjectStream,
  PDFRef,
  PDFString,
  toCharCode,
  typedArrayFor,
} from "../../../src/index.js";

describe("PDFObjectStream", () => {
  const context = PDFContext.create();

  const objects: [PDFRef, PDFObject][] = [
    [context.nextRef(), context.obj([])],
    [context.nextRef(), context.obj(true)],
    [context.nextRef(), context.obj({})],
    [context.nextRef(), PDFHexString.of("ABC123")],
    [context.nextRef(), PDFRef.of(21)],
    [context.nextRef(), context.obj("QuxBaz")],
    [context.nextRef(), context.obj(null)],
    [context.nextRef(), context.obj(21)],
    [context.nextRef(), PDFString.of("Stuff and thingz")],
  ];

  test("can be constructed from PDFObjectStream.of(...)", () => {
    expect(PDFObjectStream.withContextAndObjects(context, objects, false)).toBeInstanceOf(
      PDFObjectStream,
    );
  });

  test("can be cloned", async () => {
    const original = PDFObjectStream.withContextAndObjects(context, objects, false);
    await original.init();
    const clone = original.clone();
    await clone.init();
    expect(clone).not.toBe(original);
    expect(String(clone)).toBe(String(original));
  });

  test("can be converted to a string", async () => {
    const stream = PDFObjectStream.withContextAndObjects(context, objects, false);
    await stream.init();
    expect(String(stream)).toEqual(
      "<<\n/Type /ObjStm\n/N 9\n/First 42\n/Length 108\n>>\n" +
        "stream\n" +
        "1 0 2 4 3 9 4 15 5 24 6 31 7 39 8 44 9 47 " +
        "[ ]\n" +
        "true\n" +
        "<<\n>>\n" +
        "<ABC123>\n" +
        "21 0 R\n" +
        "/QuxBaz\n" +
        "null\n" +
        "21\n" +
        "(Stuff and thingz)\n" +
        "\nendstream",
    );
  });

  test("can provide its size in bytes", async () => {
    const stream = PDFObjectStream.withContextAndObjects(context, objects, false);
    await stream.init();
    expect(stream.sizeInBytes()).toBe(172);
  });

  test("can be serialized", async () => {
    const stream = PDFObjectStream.withContextAndObjects(context, objects, false);
    await stream.init();
    const buffer = new Uint8Array(stream.sizeInBytes() + 3).fill(toCharCode(" "));
    expect(stream.copyBytesInto(buffer, 2)).toBe(172);
    expect(buffer).toEqual(
      typedArrayFor(
        "  <<\n/Type /ObjStm\n/N 9\n/First 42\n/Length 108\n>>\n" +
          "stream\n" +
          "1 0 2 4 3 9 4 15 5 24 6 31 7 39 8 44 9 47 " +
          "[ ]\n" +
          "true\n" +
          "<<\n>>\n" +
          "<ABC123>\n" +
          "21 0 R\n" +
          "/QuxBaz\n" +
          "null\n" +
          "21\n" +
          "(Stuff and thingz)\n" +
          "\nendstream ",
      ),
    );
  });

  test("can be serialized when encoded", async () => {
    const stream = PDFObjectStream.withContextAndObjects(context, objects, true);
    await stream.init();

    // Verify the stream string contains expected structure
    const str = String(stream);
    expect(str).toContain("/Filter /FlateDecode");
    expect(str).toContain("/Type /ObjStm");
    expect(str).toContain("/N 9");
    expect(str).toContain("/First 42");
    expect(str).toContain("stream\n");
    expect(str).toContain("\nendstream");

    // Verify the size is reasonable (compressed output can vary slightly)
    expect(stream.sizeInBytes()).toBeGreaterThan(150);
    expect(stream.sizeInBytes()).toBeLessThan(220);
  });
});
