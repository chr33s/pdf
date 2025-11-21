import type DecodeStream from "./DecodeStream.js";
import type EncodeStream from "./EncodeStream.js";

export default class Enum<T = unknown> {
  public type: any;
  public options: T[];

  constructor(type: any, options: T[] = []) {
    this.type = type;
    this.options = options;
  }

  decode(stream: DecodeStream): T {
    const index = this.type.decode(stream);
    return this.options[index] ?? index;
  }

  size(): number {
    return this.type.size();
  }

  encode(stream: EncodeStream, value: T): void {
    const index = this.options.indexOf(value);
    if (index === -1) {
      throw new Error(`Unknown option in enum: ${String(value)}`);
    }

    this.type.encode(stream, index);
  }
}
