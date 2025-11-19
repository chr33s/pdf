import type DecodeStream from './DecodeStream';
import type EncodeStream from './EncodeStream';
import { Number as NumberT } from './Number';
import { resolveLength, type LengthLike } from './utils';

export default class BufferT {
  constructor(public length: LengthLike) {}

  decode(stream: DecodeStream, parent?: any): Buffer {
    const length = resolveLength(this.length, stream, parent);
    return stream.readBuffer(length);
  }

  size(value?: Buffer, parent?: any): number {
    if (!value) {
      return resolveLength(this.length, undefined, parent);
    }

    return value.length;
  }

  encode(stream: EncodeStream, value: Buffer, _parent?: any): void {
    if (this.length instanceof NumberT) {
      this.length.encode(stream, value.length);
    }

    stream.writeBuffer(value);
  }
}
