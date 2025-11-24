import PDFDict from "../objects/pdf-dict.js";
import PDFRef from "../objects/pdf-ref.js";
import PDFAcroTerminal from "./pdf-acro-terminal.js";

class PDFAcroSignature extends PDFAcroTerminal {
  static fromDict = (dict: PDFDict, ref: PDFRef) =>
    new PDFAcroSignature(dict, ref);
}

export default PDFAcroSignature;
