import { assert } from "@std/assert";
import { assets } from "../assets.ts";

// @deno-types="../dummy.d.ts"
import { ParseSpeeds, PDFDocument, PDFPage, rgb, StandardFonts } from "@chr33s/pdf";

Deno.test("Test 4: Large page count PDF", async () => {
  const { pdfs, images } = assets;

  const pdfDoc = await PDFDocument.load(pdfs.with_large_page_count, {
    parseSpeed: ParseSpeeds.Fastest,
  });

  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
  const minionsBananaImage = await pdfDoc.embedPng(images.png["minions-banana_alpha"]);
  const minionsBananaDims = minionsBananaImage.scale(0.5);

  const pages = pdfDoc.getPages();

  for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawImage(minionsBananaImage, {
        ...minionsBananaDims,
        x: width / 2 - minionsBananaDims.width / 2,
        y: height / 2 - minionsBananaDims.height / 2,
      });
    }

  // Interleave new pages between all existing ones
  for (const [idx, _] of pages.entries()) {
      const newPage = pdfDoc.insertPage(2 * idx + 1, [500, 150]);

      const fontSize = 24;
      const { width, height } = newPage.getSize();

      newPage.setFont(timesRomanFont);
      newPage.setFontSize(fontSize);

      const text = "This page was interleaved by pdf!";
      const textWidth = await timesRomanFont.widthOfTextAtSize(text, fontSize);
      const textHeight = timesRomanFont.heightAtSize(fontSize);

      await newPage.drawText(text, {
            x: width / 2 - textWidth / 2,
            y: height / 2 - textHeight / 2,
            color: rgb(0.7, 0.4, 0.9),
          });
    }

  const pdfBytes = await pdfDoc.save();
  assert(pdfBytes instanceof Uint8Array);
  assert(pdfBytes.length > 0);
});
