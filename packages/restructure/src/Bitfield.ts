import type DecodeStream from "./DecodeStream.js";
import type EncodeStream from "./EncodeStream.js";

export default class Bitfield {
  constructor(
    public type: any,
    public flags: Array<string | null | undefined> = [],
  ) {}

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
