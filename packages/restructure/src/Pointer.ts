import type DecodeStream from "./DecodeStream.js";
import type EncodeStream from "./EncodeStream.js";
import { PropertyDescriptor } from "./utils.js";

export type PointerType = "local" | "immediate" | "parent" | "global";

export interface PointerOptions {
  type?: PointerType;
  allowNull?: boolean;
  nullValue?: number;
  relativeTo?: string;
  lazy?: boolean;
}

export class Pointer {
  public options: Required<Omit<PointerOptions, "relativeTo">> & {
    relativeTo?: string;
  };
  public type: any;
  public offsetType: any;

  constructor(offsetType: any, type: any, options: PointerOptions = {}) {
    this.offsetType = offsetType;
    this.type = type === "void" ? null : type;
    this.options = {
      type: "local",
      allowNull: true,
      nullValue: 0,
      lazy: false,
      ...options,
    };
  }

  private relativeToGetter(ctx: any): number {
    if (!this.options.relativeTo) {
      return 0;
    }

    return (
      this.options.relativeTo
        .split(".")
        .reduce((obj: any, prop: string) => obj?.[prop], ctx) ?? 0
    );
  }

  decode(stream: DecodeStream, ctx: any): any {
    const offset = this.offsetType.decode(stream, ctx);

    if (offset === this.options.nullValue && this.options.allowNull) {
      return null;
    }

    let relative = 0;

    switch (this.options.type) {
      case "local":
        relative = ctx?._startOffset ?? 0;
        break;
      case "immediate":
        relative = stream.pos - this.offsetType.size();
        break;
      case "parent":
        relative = ctx?.parent?._startOffset ?? 0;
        break;
      default: {
        let current = ctx;
        while (current?.parent) {
          current = current.parent;
        }
        relative = current?._startOffset ?? 0;
      }
    }

    if (this.options.relativeTo) {
      relative += this.relativeToGetter(ctx);
    }

    const ptr = offset + relative;

    if (this.type) {
      let value: any;
      let decoded = false;
      const decodeValue = () => {
        if (decoded) {
          return value;
        }
        const pos = stream.pos;
        stream.pos = ptr;
        value = this.type.decode(stream, ctx);
        stream.pos = pos;
        decoded = true;
        return value;
      };

      if (this.options.lazy) {
        return new PropertyDescriptor({ get: decodeValue });
      }

      return decodeValue();
    }

    return ptr;
  }

  size(val?: any, ctx?: any): number {
    const parent = ctx;

    if (ctx) {
      switch (this.options.type) {
        case "local":
        case "immediate":
          break;
        case "parent":
          ctx = ctx.parent;
          break;
        default:
          while (ctx.parent) {
            ctx = ctx.parent;
          }
      }
    }

    let type = this.type;
    if (!type) {
      if (!(val instanceof VoidPointer)) {
        throw new Error("Must be a VoidPointer");
      }
      type = val.type;
      val = val.value;
    }

    if (val && ctx) {
      ctx.pointerSize += type.size(val, parent);
    }

    return this.offsetType.size();
  }

  encode(stream: EncodeStream, val: any, ctx: any): void {
    const parent = ctx;

    if (val == null) {
      this.offsetType.encode(stream, this.options.nullValue);
      return;
    }

    let relative: number;

    switch (this.options.type) {
      case "local":
        relative = ctx.startOffset;
        break;
      case "immediate":
        relative = stream.pos + this.offsetType.size(val, parent);
        break;
      case "parent":
        ctx = ctx.parent;
        relative = ctx.startOffset;
        break;
      default:
        relative = 0;
        while (ctx.parent) {
          ctx = ctx.parent;
        }
    }

    if (this.options.relativeTo) {
      relative += this.relativeToGetter(parent.val ?? parent);
    }

    this.offsetType.encode(stream, ctx.pointerOffset - relative);

    let type = this.type;
    if (!type) {
      if (!(val instanceof VoidPointer)) {
        throw new Error("Must be a VoidPointer");
      }
      type = val.type;
      val = val.value;
    }

    ctx.pointers.push({
      type,
      val,
      parent,
    });

    ctx.pointerOffset += type.size(val, parent);
  }
}

export class VoidPointer {
  public type: any;
  public value: any;

  constructor(type: any, value: any) {
    this.type = type;
    this.value = value;
  }
}
