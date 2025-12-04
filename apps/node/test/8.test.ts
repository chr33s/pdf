import fontkit from "@chr33s/fontkit";
import { ParseSpeeds, PDFDocument, rgb } from "@chr33s/pdf";
import { expect, test } from "vitest";
import { assets } from "../assets.js";

test("Test 8: PDF with comments", async () => {
  const { pdfs, fonts, images } = assets;

  const pdfDoc = await PDFDocument.load(pdfs.with_comments, {
    parseSpeed: ParseSpeeds.Fastest,
  });

  pdfDoc.registerFontkit(fontkit);

  const ubuntuFont = await pdfDoc.embedFont(fonts.ttf["ubuntu-r"], {
    subset: true,
  });
  const smallMarioImage = await pdfDoc.embedPng(images.png["small-mario"]);
  const smallMarioDims = smallMarioImage.scale(0.15);

  const pages = pdfDoc.getPages();

  const lines = [
    "This is an image of Mario running.",
    "This image and text was drawn on",
    "top of an existing PDF using pdf!",
  ];
  const fontSize = 24;
  const solarizedWhite = rgb(253 / 255, 246 / 255, 227 / 255);
  const solarizedGray = rgb(101 / 255, 123 / 255, 131 / 255);

  const textWidth = ubuntuFont.widthOfTextAtSize(lines[2], fontSize);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const centerX = width / 2;
    const centerY = height / 2 - 250;
    page.drawImage(smallMarioImage, {
      ...smallMarioDims,
      x: centerX - smallMarioDims.width / 2,
      y: centerY + 15,
    });
    const boxHeight = (fontSize + 5) * lines.length;
    page.drawRectangle({
      x: centerX - textWidth / 2 - 5,
      y: centerY - 15 - boxHeight + fontSize + 3,
      width: textWidth + 10,
      height: boxHeight,
      color: solarizedWhite,
      borderColor: solarizedGray,
      borderWidth: 3,
    });
    page.setFont(ubuntuFont);
    page.setFontColor(solarizedGray);
    await page.drawText(lines.join("\n"), {
      x: centerX - textWidth / 2,
      y: centerY - 15,
    });
  }

  const pdfBytes = await pdfDoc.save();
  expect(pdfBytes).toBeInstanceOf(Uint8Array);
  expect(pdfBytes.length).toBeGreaterThan(0);
});
