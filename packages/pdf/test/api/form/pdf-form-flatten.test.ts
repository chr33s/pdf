import { describe, expect, test } from "vitest";

import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRef,
} from "../../../src/index.js";

/**
 * Builds a widget annotation that carries its field properties (`/FT`) on the
 * annotation itself and is *not* registered in `AcroForm.Fields`, which is how
 * some producers emit standalone fields.
 */
const addOrphanWidget = (pdfDoc: PDFDocument, pageIndex = 0): PDFRef => {
  const { context } = pdfDoc;
  const page = pdfDoc.getPage(pageIndex);

  const appearanceRef = context.register(
    context.stream("", {
      Type: "XObject",
      Subtype: "Form",
      FormType: 1,
      BBox: [0, 0, 50, 20],
      Resources: {},
    }),
  );

  const widgetRef = context.register(
    context.obj({
      Type: "Annot",
      Subtype: "Widget",
      FT: "Tx",
      T: PDFHexString.fromText("orphan.field"),
      Rect: [10, 10, 60, 30],
      AP: { N: appearanceRef },
    }),
  );

  page.node.addAnnot(widgetRef);

  return widgetRef;
};

describe("PDFForm.flatten()", () => {
  test("flattens widgets that are missing from AcroForm.Fields", async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([200, 200]);
    const widgetRef = addOrphanWidget(pdfDoc);

    const page = pdfDoc.getPage(0);
    expect(page.node.Annots()?.size()).toBe(1);

    await pdfDoc.getForm().flatten();

    // the annotation is gone ...
    expect(page.node.Annots()?.size() ?? 0).toBe(0);
    expect(pdfDoc.context.lookup(widgetRef)).toBeUndefined();

    // ... and its appearance was drawn onto the page instead
    const resources = page.node.Resources();
    const xObjects = resources?.lookup(PDFName.of("XObject"), PDFDict);
    expect(xObjects?.keys().map(String).join(",")).toMatch(/FlatWidget/);
  });

  test("leaves widgets that inherit their field type from a parent", async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([200, 200]);

    const form = pdfDoc.getForm();
    const textField = form.createTextField("regular.field");
    textField.setText("hello");
    await textField.addToPage(page, { x: 10, y: 10, width: 50, height: 20 });

    const annotsBefore = page.node.Annots() as PDFArray;
    expect(annotsBefore.size()).toBe(1);

    await form.flatten();

    // the regular field is flattened by the main loop, not the orphan sweep
    expect(page.node.Annots()?.size() ?? 0).toBe(0);
    expect(form.getFields()).toHaveLength(0);
  });
});
