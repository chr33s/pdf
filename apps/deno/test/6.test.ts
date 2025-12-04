import { assert } from "@std/assert";
import { assets } from "../assets.ts";

// @deno-types="../dummy.d.ts"
import { degrees, ParseSpeeds, PDFDocument, StandardFonts } from "@chr33s/pdf";

const createDonorPdf = async () => {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([500, 500]);

  page.moveTo(50, 225);
  page.setFont(helveticaFont);
  page.setFontSize(50);
  await page.drawText("I am upside down!");
  page.setRotation(degrees(180));

  return pdfDoc;
};

Deno.test("Test 6: Copy pages from multiple PDFs", async () => {
  const { pdfs } = assets;

  const pdfDoc = await PDFDocument.load(pdfs.with_missing_endstream_eol_and_polluted_ctm, {
    parseSpeed: ParseSpeeds.Fastest,
  });

  const allDonorPdfBytes: Uint8Array[] = [
    assets.pdfs.normal,
    assets.pdfs.with_update_sections,
    assets.pdfs.linearized_with_object_streams,
    assets.pdfs.with_large_page_count,
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
    sizeOfAllDonorPdfs += allDonorPdfBytes[idx].length;
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

  assert(savedBytes instanceof Uint8Array);
  assert(savedBytes.length > 0);
});
