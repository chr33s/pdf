import fontkit from "@chr33s/pdf-fontkit";
import { assert } from "@std/assert";
import { assets } from "../assets.ts";

// @deno-types="../dummy.d.ts"
import { charAtIndex, last, PDFDocument, PDFFont, StandardFonts } from "@chr33s/pdf";

const breakTextIntoLines = async (
  text: string,
  size: number,
  font: PDFFont,
  maxWidth: number,
) => {
  const lines: string[] = [];
  let textIdx = 0;
  while (textIdx < text.length) {
    let line = "";
    while (textIdx < text.length) {
      if (text.charAt(textIdx) === "\n") {
        lines.push(line);
        textIdx += 1;
        line = "";
        continue;
      }
      const [glyph] = charAtIndex(text, textIdx);
      const newLine = line + glyph;
      if ((await font.widthOfTextAtSize(newLine, size)) > maxWidth) break;
      line = newLine;
      textIdx += glyph.length;
    }
    lines.push(line);
  }
  return lines;
};

const breakLinesIntoGroups = (lines: string[], lineHeight: number, maxHeight: number) => {
  const linesPerGroup = Math.floor(maxHeight / lineHeight);
  const groups: string[][] = [[]];
  for (let idx = 0, len = lines.length; idx < len; idx++) {
    const line = lines[idx];
    if (last(groups).length === linesPerGroup) {
      groups.push([]);
    }
    last(groups).push(line);
  }
  return groups;
};

Deno.test("Test 10: Embedded UTF-16 font demo", async () => {
  const { fonts } = assets;

  const pdfDoc = await PDFDocument.create();

  pdfDoc.registerFontkit(fontkit);

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const title = "Embedded UTF-16 Font Demo";
  const description = `
    In addition to the standard 14 fonts provided by PDF readers, the PDF
    specification allows PDF documents to embed their own fonts. The standard
    14 fonts only support a very limited latin and symbolic character set, but
    embedded fonts can support arbitrary character sets and glyphs.
    
    This document is a demonstration of an embedded font. Specifically, the
    Source Han Serif Japanese Regular font. The following pages render all
    characters supported by this font.

    The characters are rendered from greatest to least (ordered by their
    code points). Take special note of the first 1.25 pages of glyphs, as these
    glyphs represent UTF-16 code points (the rest of the glyphs in this document
    are UTF-8).`;

  const descriptionLines = await breakTextIntoLines(description, 16, helveticaFont, 600);

  const titlePage = pdfDoc.addPage([650, 700]);
  await titlePage.drawText(title, {
      font: helveticaBoldFont,
      size: 35,
      y: 700 - 100,
      x: 650 / 2 - (await helveticaBoldFont.widthOfTextAtSize(title, 35)) / 2,
    });
  await titlePage.drawText(descriptionLines.join("\n"), {
      font: helveticaFont,
      size: 16,
      y: 525,
      x: 25,
    });

  const sourceHanFont = await pdfDoc.embedFont(fonts.otf["source-hans-jp"]);

  const sourceHanFontSize = 20;
  const sourceHanString = String.fromCodePoint(...sourceHanFont.getCharacterSet().reverse());
  const sourceHanLines = await breakTextIntoLines(sourceHanString, sourceHanFontSize, sourceHanFont, 600);
  const sourceHanLineGroups = breakLinesIntoGroups(
    sourceHanLines,
    sourceHanFont.heightAtSize(sourceHanFontSize) + 10,
    675,
  );

  for (const lines of sourceHanLineGroups) {
      const page = pdfDoc.addPage([650, 700]);
      await page.drawText(lines.join("\n"), {
            font: sourceHanFont,
            size: sourceHanFontSize,
            x: 25,
            y: 700 - 25 - sourceHanFontSize,
            lineHeight: sourceHanFont.heightAtSize(sourceHanFontSize) + 10,
          });
    }

  const pdfBytes = await pdfDoc.save();
  assert(pdfBytes instanceof Uint8Array);
  assert(pdfBytes.length > 0);
});
