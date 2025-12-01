import { degrees, ParseSpeeds, PDFDocument, StandardFonts } from "@chr33s/pdf";
import { expect, test } from "vitest";
import { assets } from "./assets.js";

const createDonorPdf = async () => {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([500, 500]);

  page.moveTo(50, 225);
  page.setFont(helveticaFont);
  page.setFontSize(50);
  page.drawText("I am upside down!");
  page.setRotation(degrees(180));

  return pdfDoc;
};

test("Test 6: Copy pages from multiple PDFs", async () => {
  const pdfDoc = await PDFDocument.load(await assets.pdfs.withMissingEndstreamEol(), {
    parseSpeed: ParseSpeeds.Fastest,
  });

  const allDonorPdfBytes: ArrayBuffer[] = [
    await assets.pdfs.normal(),
    await assets.pdfs.withUpdateSections(),
    await assets.pdfs.linearizedWithObjectStreams(),
    await assets.pdfs.withLargePageCount(),
  ];

  for (let idx = 0, len = allDonorPdfBytes.length; idx < len; idx++) {
    const donorBytes = allDonorPdfBytes[idx];
    const donorPdf = await PDFDocument.load(donorBytes);
    const [donorPage] = await pdfDoc.copyPages(donorPdf, [0]);
    pdfDoc.addPage(donorPage);
  }

  const anotherDonorPdf = await createDonorPdf();
  const [anotherDonorPage] = await pdfDoc.copyPages(anotherDonorPdf, [0]);
  pdfDoc.insertPage(1, anotherDonorPage);

  const savedBytes = await pdfDoc.save();
  const sizeOfCreatedPdf = savedBytes.length;

  let sizeOfAllDonorPdfs = (await anotherDonorPdf.save()).length;
  for (let idx = 0, len = allDonorPdfBytes.length; idx < len; idx++) {
    sizeOfAllDonorPdfs += allDonorPdfBytes[idx].byteLength;
  }

  console.log();
  console.log(
    "Since pdf only copies the minimum necessary resources from a donor PDF needed to show a copied page, the size of the PDF we create from copied pages should be smaller than the size of all the donor PDFs added together:",
  );
  console.log();
  console.log(
    "  sizeOfRecipientPdf / sizeOfAllDonorPdfs = ",
    (sizeOfCreatedPdf / sizeOfAllDonorPdfs).toFixed(2),
  );

  expect(savedBytes).toBeInstanceOf(Uint8Array);
  expect(savedBytes.length).toBeGreaterThan(0);
});
