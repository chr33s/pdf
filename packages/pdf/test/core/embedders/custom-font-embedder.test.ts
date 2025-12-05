import fontkit from "@chr33s/pdf-fontkit";
import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";

import type { Fontkit } from "@chr33s/pdf-fontkit";
import {
  CustomFontEmbedder,
  PDFContext,
  PDFDict,
  PDFHexString,
  PDFRef,
} from "../../../src/index.js";

const ubuntuFont = await readFile("./assets/fonts/ubuntu/ubuntu-r.ttf");
const fk = fontkit as unknown as Fontkit;

describe("CustomFontEmbedder", () => {
  test("can be constructed with CustomFontEmbedder.for(...)", async () => {
    const embedder = await CustomFontEmbedder.for(fk, ubuntuFont);
    expect(embedder).toBeInstanceOf(CustomFontEmbedder);
  });

  test("exposes the font's name", async () => {
    const embedder = await CustomFontEmbedder.for(fk, new Uint8Array(ubuntuFont));
    expect(embedder.fontName).toBe("Ubuntu");
  });

  test("can set a custom font name", async () => {
    const customName = "abc123";
    const embedder = await CustomFontEmbedder.for(fk, new Uint8Array(ubuntuFont), customName);
    expect(embedder.customName).toBe(customName);
  });

  test("can embed font dictionaries into PDFContexts without a predefined ref", async () => {
    const context = PDFContext.create();
    const embedder = await CustomFontEmbedder.for(fk, new Uint8Array(ubuntuFont));

    expect(context.enumerateIndirectObjects().length).toBe(0);
    const ref = await embedder.embedIntoContext(context);
    expect(context.enumerateIndirectObjects().length).toBe(5);
    expect(context.lookup(ref)).toBeInstanceOf(PDFDict);
  });

  test("can embed font dictionaries into PDFContexts with a predefined ref", async () => {
    const context = PDFContext.create();
    const predefinedRef = PDFRef.of(9999);
    const embedder = await CustomFontEmbedder.for(fk, new Uint8Array(ubuntuFont));

    expect(context.enumerateIndirectObjects().length).toBe(0);
    const ref = await embedder.embedIntoContext(context, predefinedRef);
    expect(context.enumerateIndirectObjects().length).toBe(5);
    expect(context.lookup(predefinedRef)).toBeInstanceOf(PDFDict);
    expect(ref).toBe(predefinedRef);
  });

  test("can encode text strings into PDFHexString objects", async () => {
    const text = "Stuff and thingz!";
    const hexCodes = "00360057005801AA000300440051004700030057004B004C0051004A005D0004";
    const embedder = await CustomFontEmbedder.for(fk, ubuntuFont);

    expect(embedder.encodeText(text)).toBeInstanceOf(PDFHexString);
    expect(String(embedder.encodeText(text))).toBe(String(PDFHexString.of(hexCodes)));
  });

  test("can measure the width of text strings at the given font size", async () => {
    const text = "Stuff and thingz!";
    const embedder = await CustomFontEmbedder.for(fk, ubuntuFont);
    expect(embedder.widthOfTextAtSize(text, 12)).toBe(90.672);
    expect(embedder.widthOfTextAtSize(text, 24)).toBe(181.344);
  });

  test("can measure the height of the font at the given size", async () => {
    const embedder = await CustomFontEmbedder.for(fk, ubuntuFont);
    expect(embedder.heightOfFontAtSize(12)).toBeCloseTo(13.452);
    expect(embedder.heightOfFontAtSize(24)).toBeCloseTo(26.904);
  });

  test("can measure the size of the font at a given height", async () => {
    const embedder = await CustomFontEmbedder.for(fk, ubuntuFont);
    expect(embedder.sizeOfFontAtHeight(12)).toBeCloseTo(10.705);
    expect(embedder.sizeOfFontAtHeight(24)).toBeCloseTo(21.409);
  });
});
