import PDFWidgetAnnotation from "../annotation/PDFWidgetAnnotation.js";
import { IndexOutOfBoundsError } from "../errors.js";
import PDFDict from "../objects/PDFDict.js";
import PDFName from "../objects/PDFName.js";
import PDFRef from "../objects/PDFRef.js";
import PDFAcroField from "./PDFAcroField.js";

class PDFAcroTerminal extends PDFAcroField {
  static fromDict = (dict: PDFDict, ref: PDFRef) =>
    new PDFAcroTerminal(dict, ref);

  FT(): PDFName {
    const nameOrRef = this.getInheritableAttribute(PDFName.of("FT"));
    return this.dict.context.lookup(nameOrRef, PDFName);
  }

  getWidgets(): PDFWidgetAnnotation[] {
    const kidDicts = this.Kids();

    // This field is itself a widget
    if (!kidDicts) return [PDFWidgetAnnotation.fromDict(this.dict)];

    // This field's kids are its widgets
    return Array.from({ length: kidDicts.size() }, (_, idx) => {
      const dict = kidDicts.lookup(idx, PDFDict);
      return PDFWidgetAnnotation.fromDict(dict);
    });
  }

  addWidget(ref: PDFRef) {
    const { Kids } = this.normalizedEntries();
    Kids.push(ref);
  }

  removeWidget(idx: number) {
    const kidDicts = this.Kids();

    if (!kidDicts) {
      // This field is itself a widget
      if (idx !== 0) throw new IndexOutOfBoundsError(idx, 0, 0);
      this.setKids([]);
    } else {
      // This field's kids are its widgets
      if (idx < 0 || idx > kidDicts.size()) {
        throw new IndexOutOfBoundsError(idx, 0, kidDicts.size());
      }
      kidDicts.remove(idx);
    }
  }

  normalizedEntries() {
    let Kids = this.Kids();

    // If this field is itself a widget (because it was only rendered once in
    // the document, so the field and widget properties were merged) then we
    // add itself to the `Kids` array. The alternative would be to try
    // splitting apart the widget properties and creating a separate object
    // for them.
    if (!Kids) {
      Kids = this.dict.context.obj([this.ref]);
      this.dict.set(PDFName.of("Kids"), Kids);
    }

    return { Kids };
  }
}

export default PDFAcroTerminal;
