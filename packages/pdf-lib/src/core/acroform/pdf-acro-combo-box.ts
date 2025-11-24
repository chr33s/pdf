import PDFDict from "../objects/pdf-dict.js";
import PDFAcroChoice from "./pdf-acro-choice.js";
import PDFContext from "../pdf-context.js";
import PDFRef from "../objects/pdf-ref.js";
import { AcroChoiceFlags } from "./flags.js";

class PDFAcroComboBox extends PDFAcroChoice {
  static fromDict = (dict: PDFDict, ref: PDFRef) =>
    new PDFAcroComboBox(dict, ref);

  static create = (context: PDFContext) => {
    const dict = context.obj({
      FT: "Ch",
      Ff: AcroChoiceFlags.Combo,
      Kids: [],
    });
    const ref = context.register(dict);
    return new PDFAcroComboBox(dict, ref);
  };
}

export default PDFAcroComboBox;
