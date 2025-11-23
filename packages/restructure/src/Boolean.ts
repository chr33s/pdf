import Base from "./Base.js";
import type DecodeStream from "./DecodeStream.js";
import type EncodeStream from "./EncodeStream.js";

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
