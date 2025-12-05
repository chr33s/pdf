import {
  degrees,
  ParseSpeeds,
  PDFDocument,
  PDFPage,
  radians,
  rgb,
  StandardFonts,
} from "@chr33s/pdf";
import { expect, test } from "vitest";
import { assets } from "./assets.js";

test("Test 3: Standard fonts demo", async () => {
  const pdfDoc = await PDFDocument.load(await assets.pdfs.normalBase64(), {
    parseSpeed: ParseSpeeds.Fastest,
  });

  const minionsLaughingImage = await pdfDoc.embedJpg(await assets.images.jpg.minionsLaughing());
  const minionsLaughingDims = minionsLaughingImage.scale(0.6);

  const firstPage = pdfDoc.getPage(0);
  const middlePage = pdfDoc.insertPage(1, [600, 500]);
  const lastPage = pdfDoc.getPage(2);

  const fontSize = 20;
  middlePage.setFontSize(fontSize);
  middlePage.moveTo(0, middlePage.getHeight());

  for (const [idx, fontNameStr] of Object.keys(StandardFonts).entries()) {
    middlePage.moveDown(fontSize);

    const fontName = fontNameStr as keyof typeof StandardFonts;
    const fontObj = StandardFonts[fontName];
    const font = await pdfDoc.embedStandardFont(fontObj);

    middlePage.setFont(font);

    // prettier-ignore
    const text = (
          fontName === StandardFonts.Symbol ? `${idx + 1}. Τηεσε αρε τηε 14 Στανδαρδ Φοντσ.`
        : fontName === StandardFonts.ZapfDingbats ? '✑✔✎ ✴❈❅▲❅ ❁❒❅ ▼❈❅ ✑✔ ✳▼❁■❄❁❒❄ ✦❏■▼▲✎'
        : `${idx + 1}. These are the 14 Standard Fonts.`
      );

    await middlePage.drawText(text, {
      rotate: radians(-Math.PI / 6),
      xSkew: radians(Math.PI / 10),
      ySkew: radians(Math.PI / 10),
    });
  }

  middlePage.drawEllipse({
    x: 450,
    y: 225,
    xScale: 25,
    yScale: 150,
    color: rgb(0, 1, 0),
    borderWidth: 2,
    borderColor: rgb(1, 0, 1),
    rotate: degrees(45),
    opacity: 0.5,
  });

  const stampImage = (page: PDFPage) => {
    const { width, height } = page.getSize();
    const centerX = width / 2;
    const centerY = height / 2;
    page.drawImage(minionsLaughingImage, {
      ...minionsLaughingDims,
      x: centerX - minionsLaughingDims.width / 2,
      y: centerY - minionsLaughingDims.height / 2,
      opacity: 0.75,
    });
  };

  stampImage(firstPage);
  stampImage(lastPage);

  const pdfBytes = await pdfDoc.save();
  expect(pdfBytes).toBeInstanceOf(Uint8Array);
  expect(pdfBytes.length).toBeGreaterThan(0);
});
