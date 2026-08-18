import { expect, test } from "vitest";
import { ParseSpeeds, PDFDocument, rgb, StandardFonts } from "@chr33s/pdf";
import { assets } from "./assets.js";

test("Test 7: PDF with newline whitespace", async () => {
  const pdfDoc = await PDFDocument.load(await assets.pdfs.withNewlineWhitespace(), {
    parseSpeed: ParseSpeeds.Fastest,
  });

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  const [firstPage] = pages;

  const { width, height } = firstPage.getSize();
  const text = "pdf is awesome!";
  const textWidth = await helveticaFont.widthOfTextAtSize(text, 75);
  firstPage.moveTo(width / 2 - textWidth / 2, height - 100);
  firstPage.setFont(helveticaFont);
  firstPage.setFontSize(75);
  firstPage.setFontColor(rgb(1, 0, 0));
  await firstPage.drawText(text);

  for (const [idx, page] of pages.entries()) {
    page.moveTo(10, 10);
    page.setFont(helveticaFont);
    page.setFontSize(17);
    page.setFontColor(rgb(1, 0, 0));
    await page.drawText(`${idx + 1} / ${pages.length}`);
  }

  const pdfBytes = await pdfDoc.save();
  expect(pdfBytes).toBeInstanceOf(Uint8Array);
  expect(pdfBytes.length).toBeGreaterThan(0);
});
