import { waitForTick } from "../../utils/index.js";
import { ReparseError } from "../errors.js";
import PDFName from "../objects/PDFName.js";
import PDFNumber from "../objects/PDFNumber.js";
import PDFRawStream from "../objects/PDFRawStream.js";
import PDFRef from "../objects/PDFRef.js";
import ByteStream from "./ByteStream.js";
import PDFObjectParser from "./PDFObjectParser.js";

class PDFObjectStreamParser extends PDFObjectParser {
  static forStream = (
    rawStream: PDFRawStream,
    shouldWaitForTick?: () => boolean,
  ) => {
    try {
      return new PDFObjectStreamParser(rawStream, shouldWaitForTick);
    } catch (error) {
      return new FailedPDFObjectStreamParser(
        error,
      ) as unknown as PDFObjectStreamParser;
    }
  };

  private constructor(
    rawStream: PDFRawStream,
    shouldWaitForTick?: () => boolean,
  ) {
    super(ByteStream.fromPDFRawStream(rawStream), rawStream.dict.context);

    const { dict } = rawStream;

    this.#alreadyParsed = false;
    this.#shouldWaitForTick = shouldWaitForTick || (() => false);
    this.#firstOffset = dict.lookup(PDFName.of("First"), PDFNumber).asNumber();
    this.#objectCount = dict.lookup(PDFName.of("N"), PDFNumber).asNumber();
  }

  #alreadyParsed: boolean;
  readonly #shouldWaitForTick: () => boolean;
  readonly #firstOffset: number;
  readonly #objectCount: number;

  async parseIntoContext(): Promise<void> {
    if (this.#alreadyParsed) {
      throw new ReparseError("PDFObjectStreamParser", "parseIntoContext");
    }
    this.#alreadyParsed = true;

    const offsetsAndObjectNumbers = this.#parseOffsetsAndObjectNumbers();
    for (let idx = 0, len = offsetsAndObjectNumbers.length; idx < len; idx++) {
      const { objectNumber, offset } = offsetsAndObjectNumbers[idx];
      this.bytes.moveTo(this.#firstOffset + offset);
      const ref = PDFRef.of(objectNumber, 0);
      const object = this.parseObject(ref);
      this.context.assign(ref, object);
      if (this.#shouldWaitForTick()) await waitForTick();
    }
  }

  #parseOffsetsAndObjectNumbers(): {
    objectNumber: number;
    offset: number;
  }[] {
    const offsetsAndObjectNumbers = [];
    for (let idx = 0, len = this.#objectCount; idx < len; idx++) {
      this.skipWhitespaceAndComments();
      const objectNumber = this.parseRawInt();

      this.skipWhitespaceAndComments();
      const offset = this.parseRawInt();

      offsetsAndObjectNumbers.push({ objectNumber, offset });
    }
    return offsetsAndObjectNumbers;
  }
}

class FailedPDFObjectStreamParser {
  readonly #error: unknown;

  constructor(error: unknown) {
    this.#error = error;
  }

  async parseIntoContext(): Promise<void> {
    throw this.#error;
  }
}

export default PDFObjectStreamParser;
