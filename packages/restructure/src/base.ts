import DecodeStream from "./decode-stream.js";
import EncodeStream from "./encode-stream.js";

/** Abstract base class for binary type definitions. */
export default abstract class Base<T = unknown> {
  fromBuffer(buffer: Uint8Array): T {
    const stream = new DecodeStream(buffer);
    return (this as any).decode(stream);
  }

  toBuffer(value: T): Uint8Array {
    const size = typeof (this as any).size === "function" ? (this as any).size(value) : 0;
    const buffer = new Uint8Array(size);
    const stream = new EncodeStream(buffer);
    (this as any).encode(stream, value);
    return buffer;
  }
}
