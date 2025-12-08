import Base from "./base.js";
import type DecodeStream from "./decode-stream.js";
import type EncodeStream from "./encode-stream.js";

type Condition = boolean | ((this: any, parent?: any) => boolean);

/** A type for conditionally encoding/decoding values based on a condition. */
export default class Optional<T = unknown> extends Base<T | undefined> {
  public type: any;
  public condition: Condition;

  constructor(type: any, condition: Condition = true) {
    super();
    this.type = type;
    this.condition = condition;
  }

  #evaluateCondition(parent?: any): boolean {
    if (typeof this.condition === "function") {
      return this.condition.call(parent, parent);
    }

    return this.condition;
  }

  decode(stream: DecodeStream, parent?: any): T | undefined {
    if (this.#evaluateCondition(parent)) {
      return this.type.decode(stream, parent);
    }

    return undefined;
  }

  size(value?: T, parent?: any): number {
    if (this.#evaluateCondition(parent)) {
      return this.type.size(value, parent);
    }

    return 0;
  }

  encode(stream: EncodeStream, value: T, parent?: any): void {
    if (this.#evaluateCondition(parent)) {
      this.type.encode(stream, value, parent);
    }
  }
}
