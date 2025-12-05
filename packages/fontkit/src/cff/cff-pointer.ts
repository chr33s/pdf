import type { DecodeStream, EncodeStream, PointerOptions } from "@chr33s/pdf-restructure";
import * as r from "@chr33s/pdf-restructure";
import type { OperandValue } from "./cff-operand.js";
export default class CFFPointer extends r.Pointer {
  constructor(type: unknown, options: PointerOptions = {}) {
    if (options.type == null) {
      options.type = "global";
    }

    super(null, type, options);
  }

  decode(stream: DecodeStream, parent?: Record<string, any>): unknown;
  decode(stream: DecodeStream, parent?: Record<string, any>, operands?: number[]): unknown;
  decode(stream: DecodeStream, parent: Record<string, any> = {}, operands: number[] = []): unknown {
    this.offsetType = {
      decode: () => operands[0],
    };

    return super.decode(stream, parent);
  }

  encode(stream: EncodeStream, value: unknown, ctx: Record<string, any>): void;
  encode(stream: EncodeStream | null, value: unknown, ctx?: Record<string, any>): OperandValue[];
  encode(
    stream: EncodeStream | null,
    value: unknown,
    ctx: Record<string, any> = {},
  ): OperandValue[] | void {
    const context = ctx ?? {};

    if (!stream) {
      this.offsetType = {
        size: () => 0,
      };

      this.size(value, context);
      return [new Ptr(0)];
    }

    let ptr: number | null = null;
    this.offsetType = {
      encode: (_stream: EncodeStream, val: number) => (ptr = val),
    };

    super.encode(stream, value, context);
    return [new Ptr(ptr ?? 0)];
  }
}

class Ptr {
  #val: number;
  forceLarge: boolean;

  constructor(val: number) {
    this.#val = val;
    this.forceLarge = true;
  }

  valueOf() {
    return this.#val;
  }
}
