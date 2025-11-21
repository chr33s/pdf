let iconv: typeof import("iconv-lite") | null = null;
try {
  iconv = require("iconv-lite");
} catch {
  iconv = null;
}

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
  public buffer: Buffer;
  [key: string]: any;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.length = buffer.length;
  }

  readString(length: number, encoding: string = "ascii"): string | Buffer {
    switch (encoding) {
      case "utf16le":
      case "ucs2":
      case "utf8":
      case "ascii":
        return this.buffer.toString(encoding, this.pos, (this.pos += length));
      case "utf16be": {
        const buf = Buffer.from(this.readBuffer(length));
        for (let i = 0; i < buf.length - 1; i += 2) {
          const byte = buf[i];
          buf[i] = buf[i + 1];
          buf[i + 1] = byte;
        }
        return buf.toString("utf16le");
      }
      default: {
        const buf = this.readBuffer(length);
        if (iconv) {
          try {
            return iconv.decode(buf, encoding);
          } catch {
            // ignore and fall through to returning the raw buffer
          }
        }
        return buf;
      }
    }
  }

  readBuffer(length: number): Buffer {
    const start = this.pos;
    this.pos += length;
    return this.buffer.slice(start, this.pos);
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

const readMethodNames = Object.getOwnPropertyNames(Buffer.prototype).filter(
  (key) => key.startsWith("read"),
);

for (const key of readMethodNames) {
  const baseName = key.replace(/read|[BL]E/g, "");
  const bytes = DecodeStream.TYPES[baseName as keyof typeof DecodeStream.TYPES];
  if (!bytes) {
    continue;
  }

  Object.defineProperty(DecodeStream.prototype, key, {
    value(this: DecodeStream) {
      const result = (this.buffer as any)[key](this.pos);
      this.pos += bytes;
      return result;
    },
  });
}
