import { deflate } from "@chr33s/compression";
import { describe, expect, test } from "vitest";

import {
  mergeIntoTypedArray,
  moveText,
  PDFOperatorNames as Ops,
  PDFContentStream,
  PDFContext,
  PDFDict,
  PDFName,
  PDFNumber,
  PDFOperator,
  PDFString,
  popGraphicsState,
  pushGraphicsState,
  toCharCode,
  typedArrayFor,
} from "../../../src/index.js";

describe("PDFContentStream", () => {
  const context = PDFContext.create();
  const dict = PDFDict.withContext(context);
  const operators = [
    PDFOperator.of(Ops.BeginText),
    PDFOperator.of(Ops.SetFontAndSize, [PDFName.of("F1"), PDFNumber.of(24)]),
    PDFOperator.of(Ops.MoveText, [PDFNumber.of(100), PDFNumber.of(100)]),
    PDFOperator.of(Ops.ShowText, [PDFString.of("Hello World and stuff!")]),
    PDFOperator.of(Ops.EndText),
  ];

  test("can be constructed from PDFContentStream.of(...)", () => {
    expect(PDFContentStream.of(dict, operators, false)).toBeInstanceOf(PDFContentStream);
  });

  test("allows operators to be pushed to the end of the stream", async () => {
    const stream = PDFContentStream.of(dict, [pushGraphicsState()], false);
    stream.push(moveText(21, 99), popGraphicsState());
    await stream.init();
    expect(String(stream)).toEqual(
      "<<\n/Length 13\n>>\n" + "stream\n" + "q\n" + "21 99 Td\n" + "Q\n" + "\nendstream",
    );
  });

  test("can be cloned", async () => {
    const original = PDFContentStream.of(dict, operators, false);
    await original.init();
    const clone = original.clone();
    await clone.init();
    expect(clone).not.toBe(original);
    expect(String(clone)).toBe(String(original));
  });

  test("can be converted to a string", async () => {
    const stream = PDFContentStream.of(dict, operators, false);
    await stream.init();
    expect(String(stream)).toEqual(
      "<<\n/Length 55\n>>\n" +
        "stream\n" +
        "BT\n" +
        "/F1 24 Tf\n" +
        "100 100 Td\n" +
        "(Hello World and stuff!) Tj\n" +
        "ET\n" +
        "\nendstream",
    );
  });

  test("can provide its size in bytes", async () => {
    const stream = PDFContentStream.of(dict, operators, false);
    await stream.init();
    expect(stream.sizeInBytes()).toBe(89);
  });

  test("can be serialized", async () => {
    const stream = PDFContentStream.of(dict, operators, false);
    await stream.init();
    const buffer = new Uint8Array(stream.sizeInBytes() + 3).fill(toCharCode(" "));
    expect(stream.copyBytesInto(buffer, 2)).toBe(89);
    expect(buffer).toEqual(
      typedArrayFor(
        "  <<\n/Length 55\n>>\n" +
          "stream\n" +
          "BT\n" +
          "/F1 24 Tf\n" +
          "100 100 Td\n" +
          "(Hello World and stuff!) Tj\n" +
          "ET\n" +
          "\nendstream ",
      ),
    );
  });

  test("can be serialized when encoded", async () => {
    const contents =
      "BT\n" + "/F1 24 Tf\n" + "100 100 Td\n" + "(Hello World and stuff!) Tj\n" + "ET\n";
    const encodedContents = await deflate(contents);

    const stream = PDFContentStream.of(dict, operators, true);
    await stream.init();
    const buffer = new Uint8Array(stream.sizeInBytes() + 3).fill(toCharCode(" "));
    expect(stream.copyBytesInto(buffer, 2)).toBe(115);
    expect(buffer).toEqual(
      mergeIntoTypedArray(
        "  <<\n/Length 60\n/Filter /FlateDecode\n>>\n",
        "stream\n",
        encodedContents,
        "\nendstream ",
      ),
    );
  });
});
