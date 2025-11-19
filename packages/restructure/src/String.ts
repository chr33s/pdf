import type DecodeStream from './DecodeStream';
import type EncodeStream from './EncodeStream';
import { Number as NumberT } from './Number';
import { resolveLength, type LengthLike } from './utils';

type EncodingResolver = BufferEncoding | string | ((this: any, parent?: any) => string);

function resolveEncodingValue(resolver: EncodingResolver, parent?: any): string {
  if (typeof resolver === 'function') {
    const ctx = parent?.val ?? parent;
    return resolver.call(ctx, ctx) || 'ascii';
  }

  return resolver;
}

export default class StringT {
  constructor(public length?: LengthLike, public encoding: EncodingResolver = 'ascii') {}

  decode(stream: DecodeStream, parent?: any): string | Buffer {
    let length: number;

    if (typeof this.length !== 'undefined') {
      length = resolveLength(this.length, stream, parent);
    } else {
      const { buffer } = stream;
      let pos = stream.pos;
      while (pos < stream.length && buffer[pos] !== 0x00) {
        pos += 1;
      }
      length = pos - stream.pos;
    }

    const encoding = resolveEncodingValue(this.encoding, parent);
    const value = stream.readString(length, encoding);

    if (typeof this.length === 'undefined' && stream.pos < stream.length) {
      stream.pos += 1;
    }

    return value;
  }

  size(value?: string, parent?: any): number {
    if (!value) {
      return resolveLength(this.length, undefined, parent);
    }

    let encoding = resolveEncodingValue(this.encoding, parent);
    if (encoding === 'utf16be') {
      encoding = 'utf16le';
    }

    let size = Buffer.byteLength(value, encoding as BufferEncoding);

    if (this.length instanceof NumberT) {
      size += this.length.size();
    }

    if (typeof this.length === 'undefined') {
      size += 1;
    }

    return size;
  }

  encode(stream: EncodeStream, value: string, parent?: any): void {
    const encoding = resolveEncodingValue(this.encoding, parent) as BufferEncoding | string;

    if (this.length instanceof NumberT) {
      const normalizedEncoding = (encoding === 'utf16be' ? 'utf16le' : encoding) as BufferEncoding;
      this.length.encode(stream, Buffer.byteLength(value, normalizedEncoding));
    }

    stream.writeString(value, encoding);

    if (typeof this.length === 'undefined') {
      stream.writeUInt8(0x00);
    }
  }
}
