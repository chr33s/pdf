import type { Fontkit } from "@chr33s/pdf-fontkit";
import fontkit from "@chr33s/pdf-fontkit";
import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import { CustomFontSubsetEmbedder, PDFContext, PDFDict, PDFHexString } from "../../../src/index.js";

const ubuntuFont = await readFile("./assets/fonts/ubuntu/ubuntu-r.ttf");
const fk = fontkit as unknown as Fontkit;

describe("CustomFontSubsetEmbedder", () => {
  test("can be constructed with CustomFontSubsetEmbedder.for(...)", async () => {
    const embedder = await CustomFontSubsetEmbedder.for(fk, ubuntuFont);
    expect(embedder).toBeInstanceOf(CustomFontSubsetEmbedder);
  });

  test("can embed standard font dictionaries into PDFContexts", async () => {
    const context = PDFContext.create();
    const embedder = await CustomFontSubsetEmbedder.for(fk, new Uint8Array(ubuntuFont));

    expect(context.enumerateIndirectObjects().length).toBe(0);
    const ref = await embedder.embedIntoContext(context);
    expect(context.enumerateIndirectObjects().length).toBe(5);
    expect(context.lookup(ref)).toBeInstanceOf(PDFDict);
  });

  test("can encode text strings into PDFHexString objects", async () => {
    const text = "Stuff and thingz!";
    const hexCodes = "00010002000300040005000600070008000500020009000A0007000B000C000D";
    const embedder = await CustomFontSubsetEmbedder.for(fk, ubuntuFont);

    expect(await embedder.encodeText(text)).toBeInstanceOf(PDFHexString);
    const encoded = await embedder.encodeText(text);
    expect(encoded.asString()).toBe(PDFHexString.of(hexCodes).asString());
  });

  test("can measure the width of text strings at the given font size", async () => {
    const text = "Stuff and thingz!";
    const embedder = await CustomFontSubsetEmbedder.for(fk, ubuntuFont);
    expect(await embedder.widthOfTextAtSize(text, 12)).toBe(90.672);
    expect(await embedder.widthOfTextAtSize(text, 24)).toBe(181.344);
  });

  test("can measure the height of the font at the given size", async () => {
    const embedder = await CustomFontSubsetEmbedder.for(fk, ubuntuFont);
    expect(embedder.heightOfFontAtSize(12)).toBeCloseTo(13.452);
    expect(embedder.heightOfFontAtSize(24)).toBeCloseTo(26.904);
  });

  test("can measure the size of the font at a given height", async () => {
    const embedder = await CustomFontSubsetEmbedder.for(fk, ubuntuFont);
    expect(embedder.sizeOfFontAtHeight(12)).toBeCloseTo(10.705);
    expect(embedder.sizeOfFontAtHeight(24)).toBeCloseTo(21.409);
  });
});
