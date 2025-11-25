import { describe, expect, test } from "vitest";

import {
  PDFContext,
  PDFHexString,
  PDFName,
  PDFNull,
  PDFString,
  PDFWidgetAnnotation,
} from "../../../src/index.js";

describe("PDFWidgetAnnotation", () => {
  test("returns undefined for missing (DAs)", () => {
    const context = PDFContext.create();

    const parentRef = context.nextRef();
    const widget = PDFWidgetAnnotation.create(context, parentRef);
    widget.dict.set(PDFName.of("DA"), PDFNull);

    expect(widget.getDefaultAppearance()).toBe(undefined);
  });

  test("returns normal direct appearance strings (DAs)", () => {
    const context = PDFContext.create();

    const parentRef = context.nextRef();
    const widget = PDFWidgetAnnotation.create(context, parentRef);
    widget.dict.set(PDFName.of("DA"), PDFString.of("/ZaDb 10 Tf 0 g"));

    expect(widget.getDefaultAppearance()).toBe("/ZaDb 10 Tf 0 g");
  });

  test("returns hexadecimal (non-standard) direct appearance strings (DAs)", () => {
    const context = PDFContext.create();

    const parentRef = context.nextRef();
    const widget = PDFWidgetAnnotation.create(context, parentRef);
    widget.dict.set(PDFName.of("DA"), PDFHexString.fromText("/ZaDb 10 Tf 0 g"));

    expect(widget.getDefaultAppearance()).toBe("/ZaDb 10 Tf 0 g");
  });
});
