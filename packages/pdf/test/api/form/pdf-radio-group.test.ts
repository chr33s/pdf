import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import {
  AnnotationFlags,
  PDFArray,
  PDFDocument,
  PDFHexString,
  PDFName,
} from "../../../src/index.js";

const fancyFieldsPdfBytes = await readFile("assets/pdfs/fancy-fields.pdf");

describe("PDFRadioGroup", () => {
  test("can read its options", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const historicalFigures = form.getRadioGroup("Historical Figures 🐺");
    expect(historicalFigures.getOptions()).toEqual([
      "Marcus Aurelius 🏛️",
      "Ada Lovelace 💻",
      "Marie Curie ☢️",
      "Alexander Hamilton 🇺🇸",
    ]);
  });

  test("can read its selected value", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const historicalFigures = form.getRadioGroup("Historical Figures 🐺");
    expect(historicalFigures.getSelected()).toEqual("Marcus Aurelius 🏛️");
  });

  test("can clear its value", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const historicalFigures = form.getRadioGroup("Historical Figures 🐺");
    historicalFigures.clear();
    expect(historicalFigures.getSelected()).toBe(undefined);
  });

  test("can select a value", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const historicalFigures = form.getRadioGroup("Historical Figures 🐺");
    historicalFigures.select("Marie Curie ☢️");
    expect(historicalFigures.getSelected()).toBe("Marie Curie ☢️");
  });

  test("can read its flag states", async () => {
    const pdfDoc = await PDFDocument.load(fancyFieldsPdfBytes);
    const form = pdfDoc.getForm();
    const historicalFigures = form.getRadioGroup("Historical Figures 🐺");

    expect(historicalFigures.isExported()).toBe(true);
    expect(historicalFigures.isReadOnly()).toBe(false);
    expect(historicalFigures.isRequired()).toBe(false);
    expect(historicalFigures.isMutuallyExclusive()).toBe(true);
    expect(historicalFigures.isOffToggleable()).toBe(false);
  });

  test("supports mutualExclusion=true", async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const form = pdfDoc.getForm();

    const radioGroup = form.createRadioGroup("test.group");
    radioGroup.enableMutualExclusion();

    await radioGroup.addOptionToPage("foo", page);
    await radioGroup.addOptionToPage("bar", page);
    await radioGroup.addOptionToPage("foo", page);
    await radioGroup.addOptionToPage("qux", page);

    const getOnWidgets = () =>
      radioGroup.acroField
        .getWidgets()
        .filter((w) => w.getOnValue() === radioGroup.acroField.getValue());

    expect(getOnWidgets().length).toBe(0);

    radioGroup.select("foo");

    expect(getOnWidgets().length).toBe(1);

    expect(radioGroup.getOptions()).toEqual(["foo", "bar", "foo", "qux"]);

    const onValues = radioGroup.acroField.getWidgets().map((w) => w.getOnValue());

    expect(onValues).toEqual([PDFName.of("0"), PDFName.of("1"), PDFName.of("2"), PDFName.of("3")]);

    const opt = radioGroup.acroField.Opt() as PDFArray;
    expect(opt).toBeInstanceOf(PDFArray);
    expect(opt.size()).toBe(4);
    expect((opt.get(0) as PDFHexString).decodeText()).toBe("foo");
    expect((opt.get(1) as PDFHexString).decodeText()).toBe("bar");
    expect((opt.get(2) as PDFHexString).decodeText()).toBe("foo");
    expect((opt.get(3) as PDFHexString).decodeText()).toBe("qux");
  });

  test("supports mutualExclusion=false", async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const form = pdfDoc.getForm();

    const radioGroup = form.createRadioGroup("test.group");
    radioGroup.disableMutualExclusion();

    await radioGroup.addOptionToPage("foo", page);
    await radioGroup.addOptionToPage("bar", page);
    await radioGroup.addOptionToPage("foo", page);
    await radioGroup.addOptionToPage("qux", page);

    const getOnWidgets = () =>
      radioGroup.acroField
        .getWidgets()
        .filter((w) => w.getOnValue() === radioGroup.acroField.getValue());

    expect(getOnWidgets().length).toBe(0);

    radioGroup.select("foo");

    expect(getOnWidgets().length).toBe(2);

    expect(radioGroup.getOptions()).toEqual(["foo", "bar", "foo", "qux"]);

    const onValues = radioGroup.acroField.getWidgets().map((w) => w.getOnValue());

    expect(onValues).toEqual([PDFName.of("0"), PDFName.of("1"), PDFName.of("0"), PDFName.of("3")]);

    const opt = radioGroup.acroField.Opt() as PDFArray;
    expect(opt).toBeInstanceOf(PDFArray);
    expect(opt.size()).toBe(4);
    expect((opt.get(0) as PDFHexString).decodeText()).toBe("foo");
    expect((opt.get(1) as PDFHexString).decodeText()).toBe("bar");
    expect((opt.get(2) as PDFHexString).decodeText()).toBe("foo");
    expect((opt.get(3) as PDFHexString).decodeText()).toBe("qux");
  });

  test("produces printable widgets when added to a page", async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const form = pdfDoc.getForm();

    const radioGroup = form.createRadioGroup("a.new.radio.group");

    const widgets = () => radioGroup.acroField.getWidgets();
    expect(widgets().length).toBe(0);

    await radioGroup.addOptionToPage("foo", page);
    expect(widgets().length).toBe(1);
    expect(widgets()[0].hasFlag(AnnotationFlags.Print)).toBe(true);
  });

  test("sets page reference when added to a page", async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const form = pdfDoc.getForm();

    const radioGroup = form.createRadioGroup("a.new.radio.group");

    const widgets = () => radioGroup.acroField.getWidgets();
    expect(widgets().length).toBe(0);

    await radioGroup.addOptionToPage("foo", page);
    expect(widgets().length).toBe(1);
    expect(widgets()[0].P()).toBe(page.ref);
  });
});
