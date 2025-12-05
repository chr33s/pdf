import type { DecodeStream, EncodeStream, NumberT } from "@chr33s/pdf-restructure";
import * as r from "@chr33s/pdf-restructure";

type IndexCodec<T = unknown> = {
  decode(stream: DecodeStream, parent?: Record<string, any>): T;
  encode(stream: EncodeStream, value: T, parent?: Record<string, any>): void;
  size(value: T, parent?: Record<string, any>): number;
};

type IndexEntry<T> = T | { offset: number; length: number };

export default class CFFIndex<T = Buffer> {
  #type?: IndexCodec<T>;

  constructor(type?: IndexCodec<T>) {
    this.#type = type;
  }

  getCFFVersion(ctx?: Record<string, any>) {
    let current = ctx;
    while (current && !current.hdrSize) {
      current = current.parent;
    }

    return current ? current.version : -1;
  }

  decode(stream: DecodeStream, parent: Record<string, any>) {
    const version = this.getCFFVersion(parent);
    const count = version >= 2 ? stream.readUInt32BE() : stream.readUInt16BE();

    if (count === 0) {
      return [] as IndexEntry<T>[];
    }

    const offSize = stream.readUInt8();
    let offsetType: NumberT;
    if (offSize === 1) {
      offsetType = r.uint8;
    } else if (offSize === 2) {
      offsetType = r.uint16;
    } else if (offSize === 3) {
      offsetType = r.uint24;
    } else if (offSize === 4) {
      offsetType = r.uint32;
    } else {
      throw new Error(`Bad offset size in CFFIndex: ${offSize} ${stream.pos}`);
    }

    const ret: IndexEntry<T>[] = [];
    const startPos = stream.pos + (count + 1) * offSize - 1;

    let start = offsetType.decode(stream);
    for (let i = 0; i < count; i++) {
      const end = offsetType.decode(stream);

      if (this.#type) {
        const pos = stream.pos;
        stream.pos = startPos + start;

        parent.length = end - start;
        ret.push(this.#type.decode(stream, parent));
        stream.pos = pos;
      } else {
        ret.push({
          offset: startPos + start,
          length: end - start,
        });
      }

      start = end;
    }

    stream.pos = startPos + start;
    return ret;
  }

  size(arr: T[], parent: Record<string, any>) {
    const version = this.getCFFVersion(parent);
    let size = version >= 2 ? 4 : 2;
    if (arr.length === 0) {
      return size;
    }

    let offset = 1;
    for (let item of arr) {
      offset += this.#type ? this.#type.size(item, parent) : this.#ensureBuffer(item).length;
    }

    let offsetType: NumberT;
    if (offset <= 0xff) {
      offsetType = r.uint8;
    } else if (offset <= 0xffff) {
      offsetType = r.uint16;
    } else if (offset <= 0xffffff) {
      offsetType = r.uint24;
    } else if (offset <= 0xffffffff) {
      offsetType = r.uint32;
    } else {
      throw new Error("Bad offset in CFFIndex");
    }

    size += 1 + offsetType.size() * (arr.length + 1);
    size += offset - 1;

    return size;
  }

  encode(stream: EncodeStream, arr: T[], parent: Record<string, any>) {
    const version = this.getCFFVersion(parent);
    if (version >= 2) {
      stream.writeUInt32BE(arr.length);
    } else {
      stream.writeUInt16BE(arr.length);
    }
    if (arr.length === 0) {
      return;
    }

    const sizes: number[] = [];
    let offset = 1;
    for (let item of arr) {
      const s = this.#type ? this.#type.size(item, parent) : this.#ensureBuffer(item).length;
      sizes.push(s);
      offset += s;
    }

    let offsetType: NumberT;
    if (offset <= 0xff) {
      offsetType = r.uint8;
    } else if (offset <= 0xffff) {
      offsetType = r.uint16;
    } else if (offset <= 0xffffff) {
      offsetType = r.uint24;
    } else if (offset <= 0xffffffff) {
      offsetType = r.uint32;
    } else {
      throw new Error("Bad offset in CFFIndex");
    }

    stream.writeUInt8(offsetType.size());

    offset = 1;
    offsetType.encode(stream, offset);

    for (let size of sizes) {
      offset += size;
      offsetType.encode(stream, offset);
    }

    for (let item of arr) {
      if (this.#type) {
        this.#type.encode(stream, item, parent);
      } else {
        stream.writeBuffer(this.#ensureBuffer(item));
      }
    }
  }

  #ensureBuffer(value: T): Uint8Array {
    if (value instanceof Uint8Array) {
      return value;
    }

    throw new Error("CFFIndex expects Uint8Array values when no type is provided");
  }
}
