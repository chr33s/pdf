import Base from "./base.js";
import type DecodeStream from "./decode-stream.js";
import type EncodeStream from "./encode-stream.js";
import { Number as NumberT } from "./number.js";
import { resolveLength, type LengthLike } from "./utils.js";

type EncodingResolver =
  | string
  | ((this: any, parent?: any) => string | undefined);

const ENCODING_ALIASES: Record<string, string> = {
  "utf-8": "utf8",
  utf8: "utf8",
  ascii: "ascii",
  utf16: "utf16le",
  "utf-16": "utf16le",
  utf16le: "utf16le",
  "utf-16le": "utf16le",
  "utf16-le": "utf16le",
  "utf-16-le": "utf16le",
  utf16be: "utf16be",
  "utf-16be": "utf16be",
  "utf16-be": "utf16be",
  "utf-16-be": "utf16be",
  ucs2: "ucs2",
};

function normalizeEncoding(encoding: string | undefined): string {
  if (!encoding) {
    return "ascii";
  }
  const key = encoding.toLowerCase();
  return ENCODING_ALIASES[key] ?? key;
}

function resolveEncodingValue(
  resolver: EncodingResolver,
  parent?: any,
  useParentVal = false,
): string {
  if (typeof resolver === "function") {
    const ctx = useParentVal ? (parent?.val ?? parent) : parent;
    return normalizeEncoding(resolver.call(ctx, ctx));
  }

  return normalizeEncoding(resolver);
}

function encodingWidth(encoding: string): number {
  switch (encoding) {
    case "ascii":
    case "utf8":
      return 1;
    case "utf16le":
    case "utf16be":
    case "ucs2":
      return 2;
    default:
      return 1;
  }
}

function encodingForByteLength(encoding: string): BufferEncoding {
  if (encoding === "utf16be") {
    return "utf16le";
  }
  return encoding as BufferEncoding;
}

export default class StringT extends Base<string | Buffer> {
  public length?: LengthLike;
  public encoding: EncodingResolver;

  constructor(length?: LengthLike, encoding: EncodingResolver = "ascii") {
    super();
    this.length = length;
    this.encoding = encoding;
  }

  decode(stream: DecodeStream, parent?: any): string | Buffer {
    const encoding = resolveEncodingValue(this.encoding, parent);
    const width = encodingWidth(encoding);

    let length: number;

    if (typeof this.length !== "undefined") {
      length = resolveLength(this.length, stream, parent);
    } else {
      const { buffer } = stream;
      let pos = stream.pos;
      const limit = stream.length;
      const maxPos = Math.max(limit - width + 1, stream.pos);

      while (
        pos < maxPos &&
        (buffer[pos] !== 0x00 || (width === 2 && buffer[pos + 1] !== 0x00))
      ) {
        pos += width;
      }

      length = Math.max(pos - stream.pos, 0);
    }

    const value = stream.readString(length, encoding);

    if (typeof this.length === "undefined" && stream.pos < stream.length) {
      stream.pos += width;
    }

    return value;
  }

  size(value?: string, parent?: any): number {
    if (value == null) {
      return resolveLength(this.length, undefined, parent);
    }

    const encoding = resolveEncodingValue(this.encoding, parent, true);
    let size = Buffer.byteLength(value, encodingForByteLength(encoding));

    if (this.length instanceof NumberT) {
      size += this.length.size();
    }

    if (typeof this.length === "undefined") {
      size += encodingWidth(encoding);
    }

    return size;
  }

  encode(stream: EncodeStream, value: string, parent?: any): void {
    const encoding = resolveEncodingValue(this.encoding, parent, true);
    const width = encodingWidth(encoding);

    if (this.length instanceof NumberT) {
      const byteLengthEncoding = encodingForByteLength(encoding);
      this.length.encode(stream, Buffer.byteLength(value, byteLengthEncoding));
    }

    stream.writeString(value, encoding);

    if (typeof this.length === "undefined") {
      if (width === 2) {
        stream.writeUInt16LE(0x0000);
      } else {
        stream.writeUInt8(0x00);
      }
    }
  }
}
