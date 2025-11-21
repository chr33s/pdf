import { copyStringIntoBuffer, numberToString } from "../../utils/index.js";

import PDFObject from "./PDFObject.js";

class PDFNumber extends PDFObject {
  static of = (value: number) => new PDFNumber(value);

  readonly #numberValue: number;
  readonly #stringValue: string;

  private constructor(value: number) {
    super();
    this.#numberValue = value;
    this.#stringValue = numberToString(value);
  }

  asNumber(): number {
    return this.#numberValue;
  }

  /** @deprecated in favor of [[PDFNumber.asNumber]] */
  value(): number {
    return this.#numberValue;
  }

  clone(): PDFNumber {
    return PDFNumber.of(this.#numberValue);
  }

  toString(): string {
    return this.#stringValue;
  }

  sizeInBytes(): number {
    return this.#stringValue.length;
  }

  copyBytesInto(buffer: Uint8Array, offset: number): number {
    copyStringIntoBuffer(this.#stringValue, buffer, offset);
    return this.#stringValue.length;
  }
}

export default PDFNumber;
