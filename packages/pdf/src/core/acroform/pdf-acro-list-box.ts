import PDFDict from "../objects/pdf-dict.js";
import PDFAcroChoice from "./pdf-acro-choice.js";
import PDFContext from "../pdf-context.js";
import PDFRef from "../objects/pdf-ref.js";

class PDFAcroListBox extends PDFAcroChoice {
  static fromDict = (dict: PDFDict, ref: PDFRef) =>
    new PDFAcroListBox(dict, ref);

  static create = (context: PDFContext) => {
    const dict = context.obj({
      FT: "Ch",
      Kids: [],
    });
    const ref = context.register(dict);
    return new PDFAcroListBox(dict, ref);
  };
}

export default PDFAcroListBox;
