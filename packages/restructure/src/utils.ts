import type DecodeStream from './DecodeStream';
import { NumberT } from './Number';

export type LengthLike = number | string | ((this: any, parent?: any) => number) | NumberT;

export function resolveLength(
  length: LengthLike | undefined,
  stream?: DecodeStream,
  parent?: any,
): number {
  let resolved: number | undefined;

  if (typeof length === 'number') {
    resolved = length;
  } else if (typeof length === 'function') {
    resolved = length.call(parent, parent);
  } else if (parent && typeof length === 'string') {
    resolved = parent[length];
  } else if (stream && length instanceof NumberT) {
    resolved = length.decode(stream);
  }

  if (typeof resolved !== 'number' || Number.isNaN(resolved)) {
    throw new Error('Not a fixed size');
  }

  return resolved;
}

export class PropertyDescriptor<T = unknown> {
  enumerable = true;
  configurable = true;
  value?: T;
  get?: () => T;
  set?: (value: T) => void;

  constructor(opts: Partial<PropertyDescriptor<T>> = {}) {
    Object.assign(this, opts);
  }
}
