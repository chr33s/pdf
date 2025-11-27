import fontkit from "@chr33s/fontkit";
import { expect, test } from "vitest";
import {
  AFRelationship,
  clip,
  clipEvenOdd,
  closePath,
  degrees,
  drawRectangle,
  endPath,
  lineTo,
  moveTo,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  StandardFonts,
  typedArrayFor,
} from "@chr33s/pdf";
import { assets } from "./assets.js";

const ipsumLines = [
  "Eligendi est pariatur quidem in non excepturi et.",
  "Consectetur non tenetur magnam est corporis tempor.",
  "Labore nisi officiis quia ipsum qui voluptatem omnis.",
];

test("Test 0: Create PDF with multiple features", async () => {
  const pdfDoc = await PDFDocument.create();

  pdfDoc.setTitle("🥚 The Life of an Egg 🍳", { showInWindowTitleBar: true });
  pdfDoc.setAuthor("Humpty Dumpty");
  pdfDoc.setSubject("📘 An Epic Tale of Woe 📖");
  pdfDoc.setKeywords(["eggs", "wall", "fall", "king", "horses", "men"]);
  pdfDoc.setProducer("PDF App 9000 🤖");
  pdfDoc.setCreator("PDF App 9000 🤖");
  pdfDoc.setCreationDate(new Date("2018-06-24T01:58:37.228Z"));
  pdfDoc.setModificationDate(new Date("2018-12-21T07:00:11.000Z"));

  pdfDoc.registerFontkit(fontkit);

  await pdfDoc.attach(await assets.images.png.greyscaleBird(), "bird.png", {
    mimeType: "image/png",
    description: "A bird in greyscale 🐦",
    creationDate: new Date("2006/06/06"),
    modificationDate: new Date("2007/07/07"),
    afRelationship: AFRelationship.Data,
  });

  const csvString = ["Year,Make,Model", "1997,Ford,E350", "2000,Mercury,Cougar"].join("\n");
  await pdfDoc.attach(typedArrayFor(csvString), "cars.csv", {
    mimeType: "text/csv",
    description: "Some car info 🚗",
    creationDate: new Date("2000/01/13"),
    modificationDate: new Date("2012/12/12"),
    afRelationship: AFRelationship.Unspecified,
  });

  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const size = 750;

  pdfDoc.addJavaScript("main", 'console.show(); console.println("Hello World!")');

  // Page 1: Test drawing operations
  const page1 = pdfDoc.addPage([size, size]);

  page1.moveTo(0, size / 2);
  page1.drawSquare({ size: size / 2, color: rgb(1, 0, 0) });
  page1.pushOperators(
    pushGraphicsState(),
    moveTo(0, size / 2),
    lineTo(0, size),
    lineTo(size / 2, size),
    closePath(),
    clip(),
    endPath(),
    ...drawRectangle({
      x: size / 8,
      y: size / 2 + size / 8,
      width: size / 4,
      height: size / 4,
      borderWidth: 50,
      borderColor: rgb(1, 1, 0),
      rotate: degrees(0),
      xSkew: degrees(0),
      ySkew: degrees(0),
      color: undefined,
    }),
    popGraphicsState(),
  );

  page1.pushOperators(pushGraphicsState());
  page1.moveTo(size / 2, size / 2);
  page1.drawSquare({ size: size / 2, color: rgb(0, 1, 0) });
  page1.drawEllipse({
    x: size / 2 + size / 4,
    y: size / 2 + size / 4,
    xScale: 25,
    yScale: 150,
    color: rgb(255 / 255, 153 / 255, 51 / 255),
    borderWidth: 2,
    borderColor: rgb(0, 1, 1),
    borderDashArray: [10],
  });
  page1.pushOperators(clipEvenOdd(), endPath());
  page1.setFont(timesRomanFont);
  page1.setFontColor(rgb(1, 0, 1));
  page1.setFontSize(32);
  page1.setLineHeight(32);
  page1.moveTo(size / 2 + 5, size - 5 - 25);
  page1.drawText([...ipsumLines, ...ipsumLines, ...ipsumLines, ...ipsumLines].join("\n"));
  page1.pushOperators(popGraphicsState());

  // Lower-left quadrant
  page1.moveTo(0, 0);
  page1.drawSquare({ size: size / 2, color: rgb(0, 0, 1) });

  // Lower-right quadrant
  page1.moveTo(size / 2, 0);
  page1.drawSquare({ size: size / 2, color: rgb(1, 1, 0) });

  console.log("Title:", pdfDoc.getTitle());
  console.log("Author:", pdfDoc.getAuthor());
  console.log("Subject:", pdfDoc.getSubject());

  const pdfBytes = await pdfDoc.save();
  expect(pdfBytes).toBeInstanceOf(Uint8Array);
  expect(pdfBytes.length).toBeGreaterThan(0);
});
