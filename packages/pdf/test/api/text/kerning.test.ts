import { readFile } from "node:fs/promises";

import fontkit from "@chr33s/pdf-fontkit";
import { describe, expect, test } from "vitest";

import { PDFArray, PDFContentStream, PDFDocument, PDFRef, PDFStream } from "../../../src/index.js";

const ubuntuFontBytes = await readFile("assets/fonts/ubuntu/ubuntu-m.ttf");

const extractAdjustments = (contents: string): number[] => {
  const match = contents.match(/\[([^\]]+)\]\s+TJ/);
  if (!match) return [];
  // Remove hex strings <...> and parse only the numeric adjustments
  const withoutHex = match[1].replace(/<[^>]*>/g, "");
  const numbers = withoutHex.match(/-?\d+(?:\.\d+)?/g) ?? [];
  return numbers.map(Number);
};

const resolveContentStream = (
  pdfDoc: PDFDocument,
  contents: PDFArray | PDFRef | PDFContentStream,
): PDFContentStream => {
  if (contents instanceof PDFArray) return contents.lookup(0, PDFStream) as PDFContentStream;
  if (contents instanceof PDFRef)
    return pdfDoc.context.lookup(contents, PDFStream) as PDFContentStream;
  return contents;
};

describe("kerning-aware text drawing", () => {
  test("drawText emits kerning adjustments for custom fonts", async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const font = await pdfDoc.embedFont(ubuntuFontBytes);
    const page = pdfDoc.addPage();
    const text = "WA";

    await page.drawText(text, { font, size: 24 });

    const contentsEntry = page.node.normalizedEntries().Contents;
    const contentStream = resolveContentStream(
      pdfDoc,
      contentsEntry as PDFArray | PDFRef | PDFContentStream,
    );
    const contents = contentStream.getContentsString();

    expect(contents).toContain("TJ");

    const parsedAdjustments = extractAdjustments(contents);

    const ubuntu = await fontkit.create(ubuntuFontBytes);
    const run = await ubuntu.layout(text);
    const scale = 1000 / ubuntu.unitsPerEm;
    const expectedAdjustments = run.glyphs
      .slice(0, -1)
      .map((glyph, idx) => {
        const position = run.positions?.[idx];
        const xAdvance = position?.xAdvance ?? glyph.advanceWidth;
        return (glyph.advanceWidth - xAdvance) * scale;
      })
      .filter((adjustment) => Math.abs(adjustment) > 1e-6);

    expect(expectedAdjustments.length).toBeGreaterThan(0);
    expect(parsedAdjustments.length).toBe(expectedAdjustments.length);
    expectedAdjustments.forEach((adjustment, idx) => {
      expect(parsedAdjustments[idx]).toBeCloseTo(adjustment, 4);
    });
  });
});
