import type DecodeStream from './DecodeStream';
import type EncodeStream from './EncodeStream';

export default class Enum<T = unknown> {
  constructor(public type: any, public options: T[] = []) {}

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
      throw new Error(`Unknown option in enum: ${value}`);
    }

    this.type.encode(stream, index);
  }
}
