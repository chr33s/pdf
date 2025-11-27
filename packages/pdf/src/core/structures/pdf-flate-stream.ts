import { deflate } from "@chr33s/compression";

import { MethodNotImplementedError } from "../errors.js";
import PDFDict from "../objects/pdf-dict.js";
import PDFName from "../objects/pdf-name.js";
import PDFStream from "../objects/pdf-stream.js";

class PDFFlateStream extends PDFStream {
  protected contents: Uint8Array | undefined;
  protected readonly encode: boolean;
  #initialized: boolean = false;

  constructor(dict: PDFDict, encode: boolean) {
    super(dict);

    this.encode = encode;

    if (encode) dict.set(PDFName.of("Filter"), PDFName.of("FlateDecode"));
  }

  async init(): Promise<this> {
    if (this.#initialized) return this;
    const unencodedContents = this.getUnencodedContents();
    this.contents = this.encode ? await deflate(unencodedContents) : unencodedContents;
    this.#initialized = true;
    return this;
  }

  isInitialized(): boolean {
    return this.#initialized;
  }

  getContents(): Uint8Array {
    if (!this.#initialized) {
      throw new Error(
        `${this.constructor.name} must be initialized before accessing contents. Call init() first.`,
      );
    }
    return this.contents!;
  }

  getContentsSize(): number {
    return this.getContents().length;
  }

  getUnencodedContents(): Uint8Array {
    throw new MethodNotImplementedError(this.constructor.name, "getUnencodedContents");
  }

  updateContents(contents: Uint8Array): void {
    this.contents = contents;
    this.#initialized = true;
  }

  invalidate(): void {
    this.contents = undefined;
    this.#initialized = false;
  }
}

export default PDFFlateStream;
