import { describe, expect, test } from "vitest";
import { DecodeStream, EncodeStream, Reserved, uint16, uint8 } from "../src/index.js";

describe("Reserved", () => {
  test("should have a default count of 1", () => {
    const reserved = new Reserved(uint8);
    expect(reserved.size()).to.equal(1);
  });

  test("should allow custom counts and types", () => {
    const reserved = new Reserved(uint16, 10);
    expect(reserved.size()).to.equal(20);
  });

  test("should decode", () => {
    const stream = new DecodeStream(new Uint8Array([0, 0]));
    const reserved = new Reserved(uint16);
    expect(reserved.decode(stream)).to.equal(undefined);
    expect(stream.pos).to.equal(2);
  });

  test("should encode", () => {
    const reserved = new Reserved(uint16);
    const stream = new EncodeStream(new Uint8Array(2));
    reserved.encode(stream);
    expect(stream.buffer).to.deep.equal(new Uint8Array([0, 0]));
  });
});
