import Base from "./base.js";
import type DecodeStream from "./decode-stream.js";
import type EncodeStream from "./encode-stream.js";

/** A type for encoding/decoding boolean values from numeric types. */
export default class BooleanT extends Base<boolean> {
  public type: any;

  constructor(type: any) {
    super();
    this.type = type;
  }

  decode(stream: DecodeStream, parent?: any): boolean {
    return Boolean(this.type.decode(stream, parent));
  }

  size(value?: any, parent?: any): number {
    return this.type.size(value, parent);
  }

  encode(stream: EncodeStream, value: boolean, parent?: any): void {
    this.type.encode(stream, Number(value), parent);
  }
}
