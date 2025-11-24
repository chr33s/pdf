import Base from "./base.js";
import type DecodeStream from "./decode-stream.js";
import type EncodeStream from "./encode-stream.js";
import { Number as NumberT } from "./number.js";
import { resolveLength, type LengthLike } from "./utils.js";

export default class BufferT extends Base<Buffer> {
  public length: LengthLike;

  constructor(length: LengthLike) {
    super();
    this.length = length;
  }

  decode(stream: DecodeStream, parent?: any): Buffer {
    const length = resolveLength(this.length, stream, parent);
    return stream.readBuffer(length);
  }

  size(value?: Buffer, parent?: any): number {
    if (value == null) {
      return resolveLength(this.length, undefined, parent);
    }

    let length = value.length;
    if (this.length instanceof NumberT) {
      length += this.length.size();
    }

    return length;
  }

  encode(stream: EncodeStream, value: Buffer, _parent?: any): void {
    if (this.length instanceof NumberT) {
      this.length.encode(stream, value.length);
    }

    stream.writeBuffer(value);
  }
}
