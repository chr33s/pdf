import DecodeStream from "./DecodeStream.js";
import type EncodeStream from "./EncodeStream.js";

export class NumberT {
  private fn: string;
  public type: string;
  public endian: "BE" | "LE";

  constructor(type: string, endian: "BE" | "LE" = "BE") {
    this.type = type;
    this.endian = endian;
    this.fn = type;
    if (this.type[this.type.length - 1] !== "8") {
      this.fn += this.endian;
    }
  }

  size(): number {
    const size =
      DecodeStream.TYPES[this.type as keyof typeof DecodeStream.TYPES];
    if (!size) {
      throw new Error(`Unknown number type: ${this.type}`);
    }
    return size;
  }

  decode(stream: DecodeStream): number {
    return (stream as any)[`read${this.fn}`]();
  }

  encode(stream: EncodeStream, value: number): void {
    (stream as any)[`write${this.fn}`](value);
  }
}

export const Number = NumberT;

export const uint8 = new NumberT("UInt8");
export const uint16be = new NumberT("UInt16", "BE");
export const uint16le = new NumberT("UInt16", "LE");
export const uint16 = uint16be;
export const uint24be = new NumberT("UInt24", "BE");
export const uint24le = new NumberT("UInt24", "LE");
export const uint24 = uint24be;
export const uint32be = new NumberT("UInt32", "BE");
export const uint32le = new NumberT("UInt32", "LE");
export const uint32 = uint32be;
export const int8 = new NumberT("Int8");
export const int16be = new NumberT("Int16", "BE");
export const int16le = new NumberT("Int16", "LE");
export const int16 = int16be;
export const int24be = new NumberT("Int24", "BE");
export const int24le = new NumberT("Int24", "LE");
export const int24 = int24be;
export const int32be = new NumberT("Int32", "BE");
export const int32le = new NumberT("Int32", "LE");
export const int32 = int32be;
export const floatbe = new NumberT("Float", "BE");
export const floatle = new NumberT("Float", "LE");
export const float = floatbe;
export const doublebe = new NumberT("Double", "BE");
export const doublele = new NumberT("Double", "LE");
export const double = doublebe;

export class Fixed extends NumberT {
  private readonly point: number;

  constructor(size: number, endian: "BE" | "LE", fracBits = size >> 1) {
    super(`Int${size}`, endian);
    this.point = 1 << fracBits;
  }

  decode(stream: DecodeStream): number {
    return super.decode(stream) / this.point;
  }

  encode(stream: EncodeStream, value: number): void {
    super.encode(stream, (value * this.point) | 0);
  }
}

export const fixed16be = new Fixed(16, "BE");
export const fixed16le = new Fixed(16, "LE");
export const fixed16 = fixed16be;
export const fixed32be = new Fixed(32, "BE");
export const fixed32le = new Fixed(32, "LE");
export const fixed32 = fixed32be;
