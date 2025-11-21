import { Readable } from "node:stream";
import DecodeStream from "./DecodeStream.js";

// eslint-disable-next-line @typescript-eslint/no-var-requires
let iconv: typeof import("iconv-lite") | null = null;
try {
  iconv = require("iconv-lite");
} catch {
  iconv = null;
}

export default class EncodeStream extends Readable {
  public buffer: Buffer;
  public bufferOffset = 0;
  public pos = 0;
  [key: string]: any;

  constructor(bufferSize = 65536) {
    super();
    this.buffer = Buffer.alloc(bufferSize);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  _read(): void {}

  ensure(bytes: number): void {
    if (this.bufferOffset + bytes > this.buffer.length) {
      this.flush();
    }
  }

  flush(): void {
    if (this.bufferOffset > 0) {
      this.push(Buffer.from(this.buffer.slice(0, this.bufferOffset)));
      this.bufferOffset = 0;
    }
  }

  writeBuffer(buffer: Buffer): void {
    this.flush();
    this.push(buffer);
    this.pos += buffer.length;
  }

  writeString(value: string, encoding: string = "ascii"): void {
    switch (encoding) {
      case "utf16le":
      case "ucs2":
      case "utf8":
      case "ascii":
        this.writeBuffer(Buffer.from(value, encoding));
        break;
      case "utf16be": {
        const buf = Buffer.from(value, "utf16le");
        for (let i = 0; i < buf.length - 1; i += 2) {
          const byte = buf[i];
          buf[i] = buf[i + 1];
          buf[i + 1] = byte;
        }
        this.writeBuffer(buf);
        break;
      }
      default: {
        if (iconv) {
          this.writeBuffer(iconv.encode(value, encoding));
          break;
        }
        throw new Error(
          "Install iconv-lite to enable additional string encodings.",
        );
      }
    }
  }

  writeUInt24BE(value: number): void {
    this.ensure(3);
    this.buffer[this.bufferOffset++] = (value >>> 16) & 0xff;
    this.buffer[this.bufferOffset++] = (value >>> 8) & 0xff;
    this.buffer[this.bufferOffset++] = value & 0xff;
    this.pos += 3;
  }

  writeUInt24LE(value: number): void {
    this.ensure(3);
    this.buffer[this.bufferOffset++] = value & 0xff;
    this.buffer[this.bufferOffset++] = (value >>> 8) & 0xff;
    this.buffer[this.bufferOffset++] = (value >>> 16) & 0xff;
    this.pos += 3;
  }

  writeInt24BE(value: number): void {
    if (value >= 0) {
      this.writeUInt24BE(value);
    } else {
      this.writeUInt24BE(value + 0xffffff + 1);
    }
  }

  writeInt24LE(value: number): void {
    if (value >= 0) {
      this.writeUInt24LE(value);
    } else {
      this.writeUInt24LE(value + 0xffffff + 1);
    }
  }

  fill(value: number, length: number): void {
    if (length < this.buffer.length) {
      this.ensure(length);
      this.buffer.fill(value, this.bufferOffset, this.bufferOffset + length);
      this.bufferOffset += length;
      this.pos += length;
    } else {
      const buf = Buffer.alloc(length, value);
      this.writeBuffer(buf);
    }
  }

  end(): this {
    this.flush();
    this.push(null);
    return this;
  }
}

const writeMethodNames = Object.getOwnPropertyNames(Buffer.prototype).filter(
  (key) => key.startsWith("write"),
);

for (const key of writeMethodNames) {
  const baseName = key.replace(/write|[BL]E/g, "");
  const bytes = DecodeStream.TYPES[baseName as keyof typeof DecodeStream.TYPES];
  if (!bytes) {
    continue;
  }

  Object.defineProperty(EncodeStream.prototype, key, {
    value(this: EncodeStream, value: number) {
      this.ensure(bytes);
      (this.buffer as any)[key](value, this.bufferOffset);
      this.bufferOffset += bytes;
      this.pos += bytes;
    },
  });
}
