import { expect, test } from "vitest";
import { ParseSpeeds, PDFDocument, rgb, StandardFonts } from "@chr33s/pdf";
import { assets } from "./assets.js";

test("Test 4: Large page count PDF", async () => {
  const pdfDoc = await PDFDocument.load(await assets.pdfs.withLargePageCount(), {
    parseSpeed: ParseSpeeds.Fastest,
  });

  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
  const minionsBananaImage = await pdfDoc.embedPng(await assets.images.png.minionsBananaAlpha());
  const minionsBananaDims = minionsBananaImage.scale(0.5);

  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.drawImage(minionsBananaImage, {
      ...minionsBananaDims,
      x: width / 2 - minionsBananaDims.width / 2,
      y: height / 2 - minionsBananaDims.height / 2,
    });
  });

  // Interleave new pages between all existing ones
  pages.forEach((_, idx) => {
    const newPage = pdfDoc.insertPage(2 * idx + 1, [500, 150]);

    const fontSize = 24;
    const { width, height } = newPage.getSize();

    newPage.setFont(timesRomanFont);
    newPage.setFontSize(fontSize);

    const text = "This page was interleaved by pdf!";
    const textWidth = timesRomanFont.widthOfTextAtSize(text, fontSize);
    const textHeight = timesRomanFont.heightAtSize(fontSize);

    newPage.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      color: rgb(0.7, 0.4, 0.9),
    });
  });

  const pdfBytes = await pdfDoc.save();
  expect(pdfBytes).toBeInstanceOf(Uint8Array);
  expect(pdfBytes.length).toBeGreaterThan(0);
});
