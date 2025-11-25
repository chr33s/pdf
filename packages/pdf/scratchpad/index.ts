import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "../src/index.js";
import { openPdf, Reader } from "./open.js";

void (async () => {
  const pdfDoc1 = await PDFDocument.create();
  const emblemBytes = await readFile("assets/images/mario-emblem.png");
  const image1 = await pdfDoc1.embedPng(emblemBytes);
  const page1 = pdfDoc1.addPage();
  page1.drawImage(image1, { ...image1.scale(1.0) });

  const pdfDoc1Bytes = await pdfDoc1.save();

  const pdfDoc2 = await PDFDocument.load(pdfDoc1Bytes);
  const bananaBytes = await readFile("assets/images/minions-banana_alpha.png");
  const image2 = await pdfDoc2.embedPng(bananaBytes);
  const page2 = pdfDoc2.getPage(0);
  page2.drawImage(image2, { ...image2.scale(0.5), x: 100, y: 100 });

  const pdfBytes = await pdfDoc2.save();

  await writeFile("out.pdf", pdfBytes);
  await openPdf("out.pdf", Reader.Preview);
})();
