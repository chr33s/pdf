import ArrayT from "./array.js";
import type DecodeStream from "./decode-stream.js";
import type EncodeStream from "./encode-stream.js";
import { Number as NumberT } from "./number.js";
import { resolveLength } from "./utils.js";

// Node.js inspect symbol for custom formatting
const inspectSymbol = Symbol.for("nodejs.util.inspect.custom");

export class LazyArray<T = unknown> {
  #base: number;
  #items: Array<T | undefined> = [];

  public type: any;
  public length: number;
  public stream: DecodeStream;
  public ctx: any;

  constructor(type: any, length: number, stream: DecodeStream, ctx: any) {
    this.type = type;
    this.length = length;
    this.stream = stream;
    this.ctx = ctx;
    this.#base = stream.pos;
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this.length) {
      return undefined;
    }

    if (typeof this.#items[index] === "undefined") {
      const pos = this.stream.pos;
      this.stream.pos = this.#base + this.type.size(null, this.ctx) * index;
      this.#items[index] = this.type.decode(this.stream, this.ctx);
      this.stream.pos = pos;
    }

    return this.#items[index];
  }

  toArray(): T[] {
    const values: T[] = [];
    for (let i = 0; i < this.length; i += 1) {
      const value = this.get(i);
      if (typeof value !== "undefined") {
        values.push(value);
      }
    }
    return values;
  }

  inspect(): string {
    return JSON.stringify(this.toArray());
  }

  [inspectSymbol](): string {
    return JSON.stringify(this.toArray());
  }
}

export default class LazyArrayT<T = unknown> extends ArrayT<T, LazyArray<T>> {
  decode(stream: DecodeStream, parent?: any): LazyArray<T> {
    const pos = stream.pos;
    const length = resolveLength(this.length, stream, parent);
    let ctx = parent;

    if (this.length instanceof NumberT) {
      ctx = {
        parent,
        _startOffset: pos,
        _currentOffset: 0,
        _length: length,
      };
    }

    const result = new LazyArray<T>(this.type, length, stream, ctx);
    stream.pos += length * this.type.size(null, ctx);
    return result;
  }

  size(value?: LazyArray<T> | T[], ctx?: any): number {
    const resolved = value instanceof LazyArray ? value.toArray() : value;
    return super.size(resolved as T[] | undefined, ctx);
  }

  encode(stream: EncodeStream, value: LazyArray<T> | T[], ctx?: any): void {
    const resolved = value instanceof LazyArray ? value.toArray() : value;
    super.encode(stream, resolved as T[], ctx);
  }
}
