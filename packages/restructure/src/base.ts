import DecodeStream from "./decode-stream.js";
import EncodeStream from "./encode-stream.js";

export default abstract class Base<T = unknown> {
  fromBuffer(buffer: Buffer | Uint8Array): T {
    const source = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const stream = new DecodeStream(source);
    return (this as any).decode(stream);
  }

  toBuffer(value: T): Buffer {
    const size =
      typeof (this as any).size === "function"
        ? (this as any).size(value)
        : undefined;

    const initialSize =
      typeof size === "number" && Number.isFinite(size) && size > 0
        ? size
        : undefined;

    const stream = initialSize
      ? new EncodeStream(initialSize)
      : new EncodeStream();
    (this as any).encode(stream, value);
    stream.end();
    return stream.toBuffer();
  }
}
