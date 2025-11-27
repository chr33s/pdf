// Node back-compat.
const ENCODING_MAPPING: Record<string, string> = {
  utf16le: "utf-16le",
  ucs2: "utf-16le",
  utf16be: "utf-16be",
};

export default class DecodeStream {
  public static readonly TYPES = {
    UInt8: 1,
    UInt16: 2,
    UInt24: 3,
    UInt32: 4,
    Int8: 1,
    Int16: 2,
    Int24: 3,
    Int32: 4,
    Float: 4,
    Double: 8,
  } as const;

  public pos = 0;
  public length: number;
  public buffer: Uint8Array;
  public view: DataView;
  [key: string]: any;

  constructor(buffer: Uint8Array | Buffer) {
    this.buffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
    this.length = this.buffer.length;
  }

  readString(length: number, encoding: string = "ascii"): string | Uint8Array {
    encoding = ENCODING_MAPPING[encoding] || encoding;

    const buf = this.readBuffer(length);
    try {
      const decoder = new TextDecoder(encoding);
      return decoder.decode(buf);
    } catch {
      return buf;
    }
  }

  readBuffer(length: number): Uint8Array {
    return this.buffer.slice(this.pos, (this.pos += length));
  }

  readUInt24BE(): number {
    return (this.readUInt16BE() << 8) + this.readUInt8();
  }

  readUInt24LE(): number {
    return this.readUInt16LE() + (this.readUInt8() << 16);
  }

  readInt24BE(): number {
    return (this.readInt16BE() << 8) + this.readUInt8();
  }

  readInt24LE(): number {
    return this.readUInt16LE() + (this.readInt8() << 16);
  }
}

// Generate read methods from DataView prototype
for (const key of Object.getOwnPropertyNames(DataView.prototype)) {
  if (key.slice(0, 3) === "get") {
    let type = key.slice(3).replace("Ui", "UI");
    if (type === "Float32") {
      type = "Float";
    } else if (type === "Float64") {
      type = "Double";
    }
    const bytes = DecodeStream.TYPES[type as keyof typeof DecodeStream.TYPES];
    if (!bytes) {
      continue;
    }

    (DecodeStream.prototype as any)["read" + type + (bytes === 1 ? "" : "BE")] = function (
      this: DecodeStream,
    ) {
      const ret = (this.view as any)[key](this.pos, false);
      this.pos += bytes;
      return ret;
    };

    if (bytes !== 1) {
      (DecodeStream.prototype as any)["read" + type + "LE"] = function (this: DecodeStream) {
        const ret = (this.view as any)[key](this.pos, true);
        this.pos += bytes;
        return ret;
      };
    }
  }
}
