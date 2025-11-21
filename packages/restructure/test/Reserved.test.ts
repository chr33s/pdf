import { describe, expect, it } from "vitest";
import {
  DecodeStream,
  EncodeStream,
  Reserved,
  uint16,
  uint8,
} from "../src/index.js";
import { expectStream } from "./helpers.js";

describe("Reserved", () => {
  it("should have a default count of 1", () => {
    const reserved = new Reserved(uint8);
    expect(reserved.size()).to.equal(1);
  });

  it("should allow custom counts and types", () => {
    const reserved = new Reserved(uint16, 10);
    expect(reserved.size()).to.equal(20);
  });

  it("should decode", () => {
    const stream = new DecodeStream(Buffer.from([0, 0]));
    const reserved = new Reserved(uint16);
    expect(reserved.decode(stream)).to.equal(undefined);
    expect(stream.pos).to.equal(2);
  });

  it("should encode", async () => {
    const stream = new EncodeStream();
    const reserved = new Reserved(uint16);
    const expectation = expectStream(stream, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([0, 0]));
    });

    reserved.encode(stream);
    stream.end();
    await expectation;
  });
});
