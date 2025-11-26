import type { DecodeStream, EncodeStream } from "@chr33s/restructure";
import { PropertyDescriptor } from "@chr33s/restructure";
import isEqual from "deep-equal";
import CFFOperand, { type OperandValue } from "./cff-operand.js";

type OperandList = readonly number[];

type OperandHandler = {
  decode?: (
    stream: DecodeStream,
    parent?: Record<string, unknown>,
    operands?: OperandList,
  ) => unknown;
  encode?: (
    stream: EncodeStream | null,
    value: unknown,
    ctx?: DictContext | Record<string, any>,
  ) => OperandValue | OperandValue[] | undefined;
};

type OperandSpec = string | OperandHandler | OperandSpec[];

type OperatorKey = number | [number, number];
type OperatorDefinition = [OperatorKey, string, OperandSpec, unknown];

type FieldMap = Record<number, OperatorDefinition>;

export type DictContext = {
  parent: Record<string, any>;
  val: Record<string, any>;
  pointerSize: number;
  startOffset: number;
  pointerOffset?: number;
  pointers: Array<{
    type: OperandHandler;
    val: unknown;
    parent: Record<string, any>;
  }>;
  [key: string]: unknown;
};

export default class CFFDict {
  #ops: OperatorDefinition[];
  #fields: FieldMap;

  constructor(ops: OperatorDefinition[] = []) {
    this.#ops = ops;
    this.#fields = {} as FieldMap;
    for (let field of ops) {
      const key = Array.isArray(field[0])
        ? (field[0][0] << 8) | field[0][1]
        : field[0];
      this.#fields[key] = field;
    }
  }

  #decodeOperands(
    type: OperandSpec,
    stream: DecodeStream,
    ret: Record<string, any>,
    operands: OperandList,
  ): unknown {
    if (Array.isArray(type)) {
      return operands.map((op, i) =>
        this.#decodeOperands(type[i], stream, ret, [op]),
      );
    }

    if (typeof type === "string") {
      switch (type) {
        case "number":
        case "offset":
        case "sid":
          return operands[0];
        case "boolean":
          return !!operands[0];
        default:
          return operands;
      }
    }

    if (type.decode != null) {
      return type.decode(stream, ret, operands);
    }

    return operands;
  }

  #encodeOperands(
    type: OperandSpec,
    stream: EncodeStream | null,
    ctx: DictContext,
    operands: unknown,
  ): OperandValue[] {
    if (Array.isArray(type)) {
      return (operands as unknown[]).map(
        (op, i) => this.#encodeOperands(type[i], stream, ctx, op)[0],
      );
    }

    if (typeof type === "string") {
      if (typeof operands === "number") {
        return [operands];
      }

      if (typeof operands === "boolean") {
        return [+operands];
      }

      if (Array.isArray(operands)) {
        return operands;
      }

      return [operands as OperandValue];
    }

    if (type.encode != null) {
      const encoded = type.encode(stream, operands, ctx);
      return Array.isArray(encoded)
        ? (encoded as OperandValue[])
        : [encoded as OperandValue];
    }

    return Array.isArray(operands)
      ? (operands as OperandValue[])
      : [operands as OperandValue];
  }

  decode(stream: DecodeStream, parent: Record<string, any>) {
    const end = stream.pos + parent.length;
    const ret: Record<string, any> = {};
    let operands: number[] = [];

    Object.defineProperties(ret, {
      parent: { value: parent },
      _startOffset: { value: stream.pos },
    });

    for (let key in this.#fields) {
      const field = this.#fields[key];
      ret[field[1]] = field[3];
    }

    while (stream.pos < end) {
      let b = stream.readUInt8();
      if (b < 28) {
        if (b === 12) {
          b = (b << 8) | stream.readUInt8();
        }

        const field = this.#fields[b];
        if (!field) {
          throw new Error(`Unknown operator ${b}`);
        }

        const val = this.#decodeOperands(field[2], stream, ret, operands);
        if (val != null) {
          if (val instanceof PropertyDescriptor) {
            Object.defineProperty(ret, field[1], val);
          } else {
            ret[field[1]] = val;
          }
        }

        operands = [];
      } else {
        operands.push(CFFOperand.decode(stream, b));
      }
    }

    return ret;
  }

  size(
    dict: Record<string, any>,
    parent: Record<string, any>,
    includePointers = true,
  ) {
    const ctx: DictContext = {
      parent,
      val: dict,
      pointerSize: 0,
      startOffset: parent.startOffset || 0,
      pointers: [],
    };

    let len = 0;

    // IMPORTANT: iterate over this.#ops to match encode() order
    for (let field of this.#ops) {
      const value = dict[field[1]];
      if (value == null || isEqual(value, field[3])) {
        continue;
      }

      const operands = this.#encodeOperands(field[2], null, ctx, value);
      let operandSize = 0;
      for (let op of operands) {
        operandSize += CFFOperand.size(op);
      }

      const operatorKey = Array.isArray(field[0]) ? field[0] : [field[0]];
      len += operandSize + operatorKey.length;
    }

    if (includePointers) {
      len += ctx.pointerSize;
    }

    return len;
  }

  encode(
    stream: EncodeStream,
    dict: Record<string, any>,
    parent: Record<string, any>,
  ) {
    const ctx: DictContext = {
      pointers: [],
      startOffset: stream.pos,
      parent,
      val: dict,
      pointerSize: 0,
    };

    ctx.pointerOffset = stream.pos + this.size(dict, ctx, false);

    for (let field of this.#ops) {
      const value = dict[field[1]];
      if (value == null || isEqual(value, field[3])) {
        continue;
      }

      const operands = this.#encodeOperands(field[2], stream, ctx, value);
      for (let op of operands) {
        CFFOperand.encode(stream, op);
      }

      const operatorKey = Array.isArray(field[0]) ? field[0] : [field[0]];
      for (let op of operatorKey) {
        stream.writeUInt8(op);
      }
    }

    let i = 0;
    while (i < ctx.pointers.length) {
      const ptr = ctx.pointers[i++];
      ptr.type.encode?.(stream, ptr.val, ptr.parent);
    }
  }
}
