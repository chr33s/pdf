import { describe, expect, test } from "vitest";

import { PDFContext, PDFName, PDFRef, PDFWriter } from "../../../src/index.js";

const contentStreamText = `
  BT
    /F1 24 Tf
    100 100 Td
    (Hello World and stuff!) Tj
  ET
`;

describe("PDFWriter", () => {
  test("serializes PDFContext objects using Indirect Objects and a Cross Reference table", async () => {
    const context = PDFContext.create();

    const contentStream = await context.flateStream(contentStreamText);
    const contentStreamRef = PDFRef.of(9000);
    context.assign(contentStreamRef, contentStream);

    const fontDict = context.obj({
      Type: "Font",
      Subtype: "Type1",
      Name: "F1",
      BaseFont: "Helvetica",
      Encoding: "MacRomanEncoding",
    });
    const fontDictRef = context.register(fontDict);

    const page = context.obj({
      Type: "Page",
      MediaBox: [0, 0, 612, 792],
      Contents: contentStreamRef,
      Resources: { Font: { F1: fontDictRef } },
    });
    const pageRef = context.register(page);

    const pages = context.obj({
      Type: "Pages",
      Kids: [pageRef],
      Count: 1,
    });
    const pagesRef = context.register(pages);
    page.set(PDFName.of("Parent"), pagesRef);

    const catalog = context.obj({
      Type: "Catalog",
      Pages: pagesRef,
    });
    context.trailerInfo.Root = context.register(catalog);

    const buffer = await PDFWriter.forContext(context, Infinity).serializeToBuffer();
    const pdfString = new TextDecoder("latin1").decode(buffer);

    // Verify PDF structure
    expect(pdfString).toContain("%PDF-1.7");
    expect(pdfString).toContain("%%EOF");
    expect(pdfString).toContain("/Filter /FlateDecode");
    expect(pdfString).toContain("/Type /Font");
    expect(pdfString).toContain("/Type /Page");
    expect(pdfString).toContain("/Type /Pages");
    expect(pdfString).toContain("/Type /Catalog");
    expect(pdfString).toContain("xref");
    expect(pdfString).toContain("trailer");
    expect(pdfString).toContain("startxref");

    // Verify reasonable size
    expect(buffer.length).toBeGreaterThan(400);
    expect(buffer.length).toBeLessThan(900);
  });
});
