import Base from "./base.js";
import type DecodeStream from "./decode-stream.js";
import type EncodeStream from "./encode-stream.js";
import { resolveLength, type LengthLike } from "./utils.js";

export default class Reserved extends Base<void> {
  public type: any;
  public count: LengthLike | number;

  constructor(type: any, count: LengthLike | number = 1) {
    super();
    this.type = type;
    this.count = count;
  }

  decode(stream: DecodeStream, parent?: any): undefined {
    stream.pos += this.size(undefined, parent);
    return undefined;
  }

  size(_data?: any, parent?: any): number {
    const count = resolveLength(this.count as LengthLike, undefined, parent);
    return this.type.size() * count;
  }

  encode(stream: EncodeStream, _val?: any, parent?: any): void {
    stream.fill(0, this.size(undefined, parent));
  }
}
