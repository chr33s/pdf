import Base from "./base.js";
import type DecodeStream from "./decode-stream.js";
import type EncodeStream from "./encode-stream.js";

export default class Bitfield extends Base<Record<string, boolean>> {
  public type: any;
  public flags: Array<string | null | undefined>;

  constructor(type: any, flags: Array<string | null | undefined> = []) {
    super();
    this.type = type;
    this.flags = flags;
  }

  decode(stream: DecodeStream): Record<string, boolean> {
    const value = this.type.decode(stream);
    const result: Record<string, boolean> = {};

    this.flags.forEach((flag, index) => {
      if (!flag) {
        return;
      }
      result[flag] = Boolean(value & (1 << index));
    });

    return result;
  }

  size(): number {
    return this.type.size();
  }

  encode(stream: EncodeStream, keys: Record<string, boolean>): void {
    let value = 0;
    this.flags.forEach((flag, index) => {
      if (!flag) {
        return;
      }
      if (keys[flag]) {
        value |= 1 << index;
      }
    });

    this.type.encode(stream, value);
  }
}
