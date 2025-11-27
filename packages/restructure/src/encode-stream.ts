import DecodeStream from "./decode-stream.js";

const textEncoder = new TextEncoder();
const isBigEndian = new Uint8Array(new Uint16Array([0x1234]).buffer)[0] === 0x12;

export default class EncodeStream {
  public buffer: Uint8Array;
  public view: DataView;
  public pos = 0;
  [key: string]: any;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
  }

  /**
   * Ensure the buffer has enough space for the given number of bytes.
   * If not, grow the buffer.
   */
  ensureCapacity(bytes: number): void {
    const needed = this.pos + bytes;
    if (needed <= this.buffer.length) {
      return;
    }
    // Grow by at least 2x or to the needed size, whichever is larger
    const newSize = Math.max(this.buffer.length * 2, needed);
    const newBuffer = new Uint8Array(newSize);
    newBuffer.set(this.buffer);
    this.buffer = newBuffer;
    this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
  }

  writeBuffer(buffer: Uint8Array): void {
    this.ensureCapacity(buffer.length);
    this.buffer.set(buffer, this.pos);
    this.pos += buffer.length;
  }

  writeString(string: string, encoding: string = "ascii"): void {
    let buf: Uint8Array;
    switch (encoding) {
      case "utf16le":
      case "utf16-le":
      case "ucs2": // node treats this the same as utf16.
        buf = stringToUtf16(string, isBigEndian);
        break;

      case "utf16be":
      case "utf16-be":
        buf = stringToUtf16(string, !isBigEndian);
        break;

      case "utf8":
        buf = textEncoder.encode(string);
        break;

      case "ascii":
        buf = stringToAscii(string);
        break;

      default:
        throw new Error(`Unsupported encoding: ${encoding}`);
    }

    this.writeBuffer(buf);
  }

  writeUInt24BE(val: number): void {
    this.ensureCapacity(3);
    this.buffer[this.pos++] = (val >>> 16) & 0xff;
    this.buffer[this.pos++] = (val >>> 8) & 0xff;
    this.buffer[this.pos++] = val & 0xff;
  }

  writeUInt24LE(val: number): void {
    this.ensureCapacity(3);
    this.buffer[this.pos++] = val & 0xff;
    this.buffer[this.pos++] = (val >>> 8) & 0xff;
    this.buffer[this.pos++] = (val >>> 16) & 0xff;
  }

  writeInt24BE(val: number): void {
    if (val >= 0) {
      this.writeUInt24BE(val);
    } else {
      this.writeUInt24BE(val + 0xffffff + 1);
    }
  }

  writeInt24LE(val: number): void {
    if (val >= 0) {
      this.writeUInt24LE(val);
    } else {
      this.writeUInt24LE(val + 0xffffff + 1);
    }
  }

  fill(val: number, length: number): void {
    this.ensureCapacity(length);
    this.buffer.fill(val, this.pos, this.pos + length);
    this.pos += length;
  }
}

function stringToUtf16(string: string, swap: boolean): Uint8Array {
  const buf = new Uint16Array(string.length);
  for (let i = 0; i < string.length; i++) {
    let code = string.charCodeAt(i);
    if (swap) {
      code = (code >> 8) | ((code & 0xff) << 8);
    }
    buf[i] = code;
  }
  return new Uint8Array(buf.buffer);
}

function stringToAscii(string: string): Uint8Array {
  const buf = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    // Match node.js behavior - encoding allows 8-bit rather than 7-bit.
    buf[i] = string.charCodeAt(i);
  }
  return buf;
}

// Generate write methods from DataView prototype
for (const key of Object.getOwnPropertyNames(DataView.prototype)) {
  if (key.slice(0, 3) === "set") {
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

    (EncodeStream.prototype as any)["write" + type + (bytes === 1 ? "" : "BE")] = function (
      this: EncodeStream,
      value: number,
    ) {
      this.ensureCapacity(bytes);
      (this.view as any)[key](this.pos, value, false);
      this.pos += bytes;
    };

    if (bytes !== 1) {
      (EncodeStream.prototype as any)["write" + type + "LE"] = function (
        this: EncodeStream,
        value: number,
      ) {
        this.ensureCapacity(bytes);
        (this.view as any)[key](this.pos, value, true);
        this.pos += bytes;
      };
    }
  }
}
