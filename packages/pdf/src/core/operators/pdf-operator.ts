import { copyStringIntoBuffer } from "../../utils/index.js";
import PDFArray from "../objects/pdf-array.js";
import PDFHexString from "../objects/pdf-hex-string.js";
import PDFName from "../objects/pdf-name.js";
import PDFNumber from "../objects/pdf-number.js";
import PDFObject from "../objects/pdf-object.js";
import PDFString from "../objects/pdf-string.js";
import PDFContext from "../pdf-context.js";
import CharCodes from "../syntax/char-codes.js";
import type { PDFOperatorName } from "./pdf-operator-names.js";

export type PDFOperatorArg =
  | string
  | PDFName
  | PDFArray
  | PDFNumber
  | PDFString
  | PDFHexString;

class PDFOperator {
  static of = (name: PDFOperatorName, args?: PDFOperatorArg[]) =>
    new PDFOperator(name, args);

  readonly #name: PDFOperatorName;
  readonly #args: PDFOperatorArg[];

  private constructor(name: PDFOperatorName, args?: PDFOperatorArg[]) {
    this.#name = name;
    this.#args = args || [];
  }

  clone(context?: PDFContext): PDFOperator {
    const args: PDFOperatorArg[] = Array.from({ length: this.#args.length });
    for (let idx = 0, len = args.length; idx < len; idx++) {
      const arg = this.#args[idx];
      args[idx] = arg instanceof PDFObject ? arg.clone(context) : arg;
    }
    return PDFOperator.of(this.#name, args);
  }

  toString(): string {
    let value = "";
    for (let idx = 0, len = this.#args.length; idx < len; idx++) {
      value += String(this.#args[idx]) + " ";
    }
    value += this.#name;
    return value;
  }

  sizeInBytes(): number {
    let size = 0;
    for (let idx = 0, len = this.#args.length; idx < len; idx++) {
      const arg = this.#args[idx];
      size += (arg instanceof PDFObject ? arg.sizeInBytes() : arg.length) + 1;
    }
    size += this.#name.length;
    return size;
  }

  copyBytesInto(buffer: Uint8Array, offset: number): number {
    const initialOffset = offset;

    for (let idx = 0, len = this.#args.length; idx < len; idx++) {
      const arg = this.#args[idx];
      if (arg instanceof PDFObject) {
        offset += arg.copyBytesInto(buffer, offset);
      } else {
        offset += copyStringIntoBuffer(arg, buffer, offset);
      }
      buffer[offset++] = CharCodes.Space;
    }

    offset += copyStringIntoBuffer(this.#name, buffer, offset);

    return offset - initialOffset;
  }
}

export default PDFOperator;
