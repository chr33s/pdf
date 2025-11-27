import { describe, expect, test } from "vitest";
import { DecodeStream, EncodeStream, Enum, uint8 } from "../src/index.js";

describe("Enum", () => {
  const e = new Enum(uint8, ["foo", "bar", "baz"]);

  test("should have the right size", () => {
    expect(e.size()).to.equal(1);
  });

  test("should decode", () => {
    const stream = new DecodeStream(new Uint8Array([1, 2, 0]));
    expect(e.decode(stream)).to.equal("bar");
    expect(e.decode(stream)).to.equal("baz");
    expect(e.decode(stream)).to.equal("foo");
  });

  test("should encode", () => {
    const stream = new EncodeStream(new Uint8Array(3));
    e.encode(stream, "bar");
    e.encode(stream, "baz");
    e.encode(stream, "foo");
    expect(stream.buffer).to.deep.equal(new Uint8Array([1, 2, 0]));
  });

  test("should throw on unknown option", () => {
    const stream = new EncodeStream(new Uint8Array(1));
    expect(() => e.encode(stream, "unknown")).to.throw(/unknown option/i);
  });
});
