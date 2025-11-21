import type DecodeStream from "./DecodeStream.js";
import type EncodeStream from "./EncodeStream.js";
import { PropertyDescriptor } from "./utils.js";

type FieldMap = Record<string, any>;

type PointerContext = {
  pointers: Array<{ type: any; val: any; parent: any }>;
  startOffset: number;
  pointerOffset: number;
  pointerSize: number;
  parent?: any;
  val?: any;
};

export default class Struct<
  T extends Record<string, any> = Record<string, any>,
> {
  public process?: (this: T, stream: DecodeStream) => void;
  public preEncode?: (this: T, stream: EncodeStream) => void;

  constructor(public fields: FieldMap = {}) {}

  decode(stream: DecodeStream, parent?: any, length = 0): T {
    const result = this._setup(stream, parent, length) as T;
    this._parseFields(stream, result, this.fields);
    if (this.process) {
      this.process.call(result, stream);
    }
    return result;
  }

  protected _setup(
    stream: DecodeStream,
    parent: any,
    length: number,
  ): Record<string, any> {
    const result: Record<string, any> = {};

    Object.defineProperties(result, {
      parent: { value: parent },
      _startOffset: { value: stream.pos },
      _currentOffset: { value: 0, writable: true },
      _length: { value: length },
    });

    return result;
  }

  protected _parseFields(
    stream: DecodeStream,
    target: Record<string, any>,
    fields: FieldMap,
  ): void {
    for (const [key, type] of Object.entries(fields)) {
      let value;

      if (typeof type === "function" && typeof type.decode !== "function") {
        value = type.call(target, target);
      } else if (type && typeof type.decode === "function") {
        value = type.decode(stream, target);
      }

      if (typeof value !== "undefined") {
        if (value instanceof PropertyDescriptor) {
          Object.defineProperty(target, key, value);
        } else {
          target[key] = value;
        }
      }

      target._currentOffset = stream.pos - target._startOffset;
    }
  }

  size(val: T = {} as T, parent?: any, includePointers = true): number {
    const ctx = {
      parent,
      val,
      pointerSize: 0,
    };

    let total = 0;
    for (const [key, type] of Object.entries(this.fields)) {
      if (type && typeof type.size === "function") {
        const fieldVal = val ? val[key] : undefined;
        total += type.size(fieldVal, ctx);
      }
    }

    if (includePointers) {
      total += ctx.pointerSize;
    }

    return total;
  }

  encode(stream: EncodeStream, val: T, parent?: any): void {
    if (this.preEncode) {
      this.preEncode.call(val, stream);
    }

    const ctx: PointerContext = {
      pointers: [],
      startOffset: stream.pos,
      pointerOffset: 0,
      pointerSize: 0,
      parent,
      val,
    };

    ctx.pointerOffset = stream.pos + this.size(val, ctx, false);

    for (const [key, type] of Object.entries(this.fields)) {
      if (type && typeof type.encode === "function") {
        type.encode(stream, val[key], ctx);
      }
    }

    let i = 0;
    while (i < ctx.pointers.length) {
      const ptr = ctx.pointers[i++];
      ptr.type.encode(stream, ptr.val, ptr.parent);
    }
  }
}
