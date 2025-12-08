import type DecodeStream from "./decode-stream.js";
import { NumberT } from "./number.js";

/** Represents a length value: fixed number, property name, function, or number type. */
export type LengthLike = number | string | ((this: any, parent?: any) => number) | NumberT;

/** Resolves a length value from various sources. */
export function resolveLength(
  length: LengthLike | undefined,
  stream?: DecodeStream,
  parent?: any,
): number {
  let resolved: number | undefined;

  if (typeof length === "number") {
    resolved = length;
  } else if (typeof length === "function") {
    resolved = length.call(parent, parent);
  } else if (parent && typeof length === "string") {
    resolved = parent[length];
  } else if (stream && length instanceof NumberT) {
    resolved = length.decode(stream);
  }

  if (typeof resolved !== "number" || Number.isNaN(resolved)) {
    throw new Error("Not a fixed size");
  }

  return resolved;
}

/** A helper class for defining lazy property descriptors. */
export class PropertyDescriptor<T = unknown> {
  enumerable = true;
  configurable = true;
  writable?: boolean;
  value?: T;
  get?: () => T;
  set?: (value: T) => void;

  constructor(opts: Partial<PropertyDescriptor<T>> = {}) {
    Object.assign(this, opts);

    const provided = new Set(Object.keys(opts));
    if (!provided.has("value")) {
      delete (this as Record<string, unknown>).value;
    }
    if (!provided.has("get")) {
      delete (this as Record<string, unknown>).get;
    }
    if (!provided.has("set")) {
      delete (this as Record<string, unknown>).set;
    }
    if (!provided.has("writable")) {
      delete (this as Record<string, unknown>).writable;
    }
  }
}
