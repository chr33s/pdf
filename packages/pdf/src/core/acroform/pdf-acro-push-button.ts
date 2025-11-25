import PDFDict from "../objects/pdf-dict.js";
import PDFAcroButton from "./pdf-acro-button.js";
import PDFContext from "../pdf-context.js";
import PDFRef from "../objects/pdf-ref.js";
import { AcroButtonFlags } from "./flags.js";

class PDFAcroPushButton extends PDFAcroButton {
  static fromDict = (dict: PDFDict, ref: PDFRef) =>
    new PDFAcroPushButton(dict, ref);

  static create = (context: PDFContext) => {
    const dict = context.obj({
      FT: "Btn",
      Ff: AcroButtonFlags.PushButton,
      Kids: [],
    });
    const ref = context.register(dict);
    return new PDFAcroPushButton(dict, ref);
  };
}

export default PDFAcroPushButton;
