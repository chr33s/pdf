import fs from "node:fs";
import { describe, expect, test } from "vitest";
import { AnnotationFlags, PDFDocument } from "../../../src/index.js";

const fancyFieldsPdfBytes = fs.readFileSync("assets/pdfs/fancy_fields.pdf");

describe("PDFDropdown", () => {
  test("can read its options", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const gundams = form.getDropdown("Choose A Gundam 🤖");
    expect(gundams.getOptions()).toEqual([
      "Exia",
      "Kyrios",
      "Virtue",
      "Dynames",
    ]);
  });

  test("can read its selected value", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const gundams = form.getDropdown("Choose A Gundam 🤖");
    expect(gundams.getSelected()).toEqual(["Dynames"]);
  });

  test("can clear its value", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const gundams = form.getDropdown("Choose A Gundam 🤖");
    gundams.clear();
    expect(gundams.getSelected()).toEqual([]);
  });

  test("can select a single value", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const gundams = form.getDropdown("Choose A Gundam 🤖");
    gundams.select("Kyrios");
    expect(gundams.getSelected()).toEqual(["Kyrios"]);
  });

  test("can select multiple values", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const gundams = form.getDropdown("Choose A Gundam 🤖");
    gundams.select(["Exia", "Virtue"]);
    expect(gundams.getSelected()).toEqual(["Exia", "Virtue"]);
  });

  test("can select a value not in the options list", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const gundams = form.getDropdown("Choose A Gundam 🤖");

    expect(gundams.isEditable()).toBe(false);
    expect(gundams.getOptions()).not.toContain("One Punch Man");

    gundams.select("One Punch Man");

    expect(gundams.isEditable()).toBe(true);
    expect(gundams.getSelected()).toEqual(["One Punch Man"]);
  });

  test("can merge options when selecting", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const gundams = form.getDropdown("Choose A Gundam 🤖");
    gundams.select(["Exia"], true);
    expect(gundams.getSelected()).toEqual(["Dynames", "Exia"]);
  });

  test("can read its flag states", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const gundams = form.getDropdown("Choose A Gundam 🤖");

    expect(gundams.isExported()).toBe(true);
    expect(gundams.isReadOnly()).toBe(false);
    expect(gundams.isRequired()).toBe(false);
    expect(gundams.isEditable()).toBe(false);
    expect(gundams.isMultiselect()).toBe(false);
    expect(gundams.isSelectOnClick()).toBe(false);
    expect(gundams.isSorted()).toBe(false);
    expect(gundams.isSpellChecked()).toBe(true);
  });

  test("produces printable widgets when added to a page", async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const form = pdfDoc.getForm();

    const dropdown = form.createDropdown("a.new.dropdown");

    const widgets = () => dropdown.acroField.getWidgets();
    expect(widgets().length).toBe(0);

    dropdown.addToPage(page);
    expect(widgets().length).toBe(1);
    expect(widgets()[0].hasFlag(AnnotationFlags.Print)).toBe(true);
  });

  test("sets page reference when added to a page", async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const form = pdfDoc.getForm();

    const dropdown = form.createDropdown("a.new.dropdown");

    const widgets = () => dropdown.acroField.getWidgets();
    expect(widgets().length).toBe(0);

    dropdown.addToPage(page);
    expect(widgets().length).toBe(1);
    expect(widgets()[0].P()).toBe(page.ref);
  });
});
