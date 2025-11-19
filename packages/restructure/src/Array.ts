import type DecodeStream from './DecodeStream';
import type EncodeStream from './EncodeStream';
import { Number as NumberT } from './Number';
import { resolveLength, type LengthLike } from './utils';

export type LengthType = 'count' | 'bytes';

export default class ArrayT<T = unknown, TResult = T[]> {
  constructor(
    public type: any,
    public length?: LengthLike,
    public lengthType: LengthType = 'count',
  ) {}

  decode(stream: DecodeStream, parent?: any): TResult {
    const pos = stream.pos;
    const result: any[] = [];
    let ctx = parent;
    let length: number | undefined;

    if (typeof this.length !== 'undefined') {
      length = resolveLength(this.length, stream, parent);
    }

    if (this.length instanceof NumberT) {
      Object.defineProperties(result, {
        parent: { value: parent },
        _startOffset: { value: pos },
        _currentOffset: { value: 0, writable: true },
        _length: { value: length },
      });
      ctx = result;
    }

    if (typeof length === 'undefined' || this.lengthType === 'bytes') {
      let target: number;
      if (typeof length === 'number') {
        target = stream.pos + length;
      } else if (parent?._length) {
        target = parent._startOffset + parent._length;
      } else {
        target = stream.length;
      }

      while (stream.pos < target) {
        result.push(this.type.decode(stream, ctx));
      }
    } else {
      for (let i = 0; i < length; i += 1) {
        result.push(this.type.decode(stream, ctx));
      }
    }

    return result as unknown as TResult;
  }

  size(array?: T[], ctx?: any): number {
    if (!array) {
      return this.type.size(null, ctx) * resolveLength(this.length, undefined, ctx);
    }

    let total = 0;
    let context = ctx;

    if (this.length instanceof NumberT) {
      total += this.length.size();
      context = { parent: ctx };
    }

    for (const item of array) {
      total += this.type.size(item, context);
    }

    return total;
  }

  encode(stream: EncodeStream, array: T[], parent?: any): void {
    let ctx = parent;

    if (this.length instanceof NumberT) {
      ctx = {
        pointers: [],
        startOffset: stream.pos,
        parent,
        pointerSize: 0,
      };
      ctx.pointerOffset = stream.pos + this.size(array, ctx);
      this.length.encode(stream, array.length);
    }

    for (const item of array) {
      this.type.encode(stream, item, ctx);
    }

    if (this.length instanceof NumberT) {
      let i = 0;
      while (i < ctx.pointers.length) {
        const ptr = ctx.pointers[i++];
        ptr.type.encode(stream, ptr.val, ptr.parent);
      }
    }
  }
}
