import type DecodeStream from "./DecodeStream.js";
import type EncodeStream from "./EncodeStream.js";
import Struct from "./Struct.js";

type FieldMap = Record<string, any>;

type VersionDefinitions = {
  header?: FieldMap;
  [version: string]: FieldMap | VersionedStruct | undefined;
};

type PointerContext = {
  pointers: Array<{ type: any; val: any; parent: any }>;
  startOffset: number;
  pointerOffset: number;
  pointerSize: number;
  parent?: any;
  val?: any;
};

export default class VersionedStruct extends Struct {
  public type: any;
  public versions: VersionDefinitions;

  constructor(type: any, versions: VersionDefinitions = {}) {
    super();
    this.type = type;
    this.versions = versions;
  }

  #versionGetter(parent: any): any {
    if (typeof this.type === "string") {
      return this.type
        .split(".")
        .reduce(
          (obj, prop) => (typeof obj !== "undefined" ? obj[prop] : undefined),
          parent,
        );
    }
    return undefined;
  }

  decode(stream: DecodeStream, parent?: any, length = 0): any {
    const result = this._setup(stream, parent, length);

    if (typeof this.type === "string") {
      result.version = this.#versionGetter(parent);
    } else {
      result.version = this.type.decode(stream);
    }

    if (this.versions.header) {
      this._parseFields(stream, result, this.versions.header);
    }

    const fields = this.versions[result.version];
    if (!fields) {
      throw new Error(`Unknown version ${result.version}`);
    }

    if (fields instanceof VersionedStruct) {
      return fields.decode(stream, parent);
    }

    this._parseFields(stream, result, fields);

    if (this.process) {
      this.process.call(result, stream);
    }

    return result;
  }

  size(val: any, parent?: any, includePointers = true): number {
    if (!val) {
      throw new Error("Not a fixed size");
    }

    const ctx = {
      parent,
      val,
      pointerSize: 0,
    };

    let total = 0;

    if (typeof this.type !== "string") {
      total += this.type.size(val.version, ctx);
    }

    if (this.versions.header) {
      for (const [key, type] of Object.entries(this.versions.header)) {
        if (type?.size) {
          total += type.size(val[key], ctx);
        }
      }
    }

    const fields = this.versions[val.version];
    if (!fields) {
      throw new Error(`Unknown version ${val.version}`);
    }

    if (fields instanceof VersionedStruct) {
      total += fields.size(val, parent, includePointers);
      return total;
    }

    for (const [key, type] of Object.entries(fields)) {
      if (type?.size) {
        total += type.size(val[key], ctx);
      }
    }

    if (includePointers) {
      total += ctx.pointerSize;
    }

    return total;
  }

  encode(stream: EncodeStream, val: any, parent?: any): void {
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

    if (typeof this.type !== "string") {
      this.type.encode(stream, val.version);
    }

    if (this.versions.header) {
      for (const [key, type] of Object.entries(this.versions.header)) {
        if (type?.encode) {
          type.encode(stream, val[key], ctx);
        }
      }
    }

    const fields = this.versions[val.version];
    if (!fields) {
      throw new Error(`Unknown version ${val.version}`);
    }

    if (fields instanceof VersionedStruct) {
      fields.encode(stream, val, parent);
    } else {
      for (const [key, type] of Object.entries(fields)) {
        if (type?.encode) {
          type.encode(stream, val[key], ctx);
        }
      }
    }

    let i = 0;
    while (i < ctx.pointers.length) {
      const ptr = ctx.pointers[i++];
      ptr.type.encode(stream, ptr.val, ptr.parent);
    }
  }
}
