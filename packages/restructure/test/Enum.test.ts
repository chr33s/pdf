import { describe, expect, it } from "vitest";
import { DecodeStream, EncodeStream, Enum, uint8 } from "../src/index.js";
import { expectStream } from "./helpers.js";

describe("Enum", () => {
  const e = new Enum(uint8, ["foo", "bar", "baz"]);

  it("should have the right size", () => {
    expect(e.size()).to.equal(1);
  });

  it("should decode", () => {
    const stream = new DecodeStream(Buffer.from([1, 2, 0]));
    expect(e.decode(stream)).to.equal("bar");
    expect(e.decode(stream)).to.equal("baz");
    expect(e.decode(stream)).to.equal("foo");
  });

  it("should encode", async () => {
    const stream = new EncodeStream();
    const expectation = expectStream(stream, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([1, 2, 0]));
    });

    e.encode(stream, "bar");
    e.encode(stream, "baz");
    e.encode(stream, "foo");
    stream.end();
    await expectation;
  });

  it("should throw on unknown option", () => {
    const stream = new EncodeStream();
    expect(() => e.encode(stream, "unknown")).to.throw(/unknown option/i);
  });
});
