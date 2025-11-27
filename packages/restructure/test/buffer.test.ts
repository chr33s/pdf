import { describe, expect, test } from "vitest";
import { Buffer as BufferT, DecodeStream, EncodeStream, uint8 } from "../src/index.js";

describe("Buffer", () => {
  describe("decode", () => {
    test("should decode", () => {
      const stream = new DecodeStream(new Uint8Array([0xab, 0xff, 0x1f, 0xb6]));
      const buf = new BufferT(2);
      expect(buf.decode(stream)).to.deep.equal(new Uint8Array([0xab, 0xff]));
      expect(buf.decode(stream)).to.deep.equal(new Uint8Array([0x1f, 0xb6]));
    });

    test("should decode with parent key length", () => {
      const stream = new DecodeStream(new Uint8Array([0xab, 0xff, 0x1f, 0xb6]));
      const buf = new BufferT("len");
      expect(buf.decode(stream, { len: 3 })).to.deep.equal(new Uint8Array([0xab, 0xff, 0x1f]));
      expect(buf.decode(stream, { len: 1 })).to.deep.equal(new Uint8Array([0xb6]));
    });
  });

  describe("size", () => {
    test("should return size", () => {
      const buf = new BufferT(2);
      expect(buf.size(new Uint8Array([0xab, 0xff]))).to.equal(2);
    });

    test("should use defined length if no value given", () => {
      const array = new BufferT(10);
      expect(array.size()).to.equal(10);
    });
  });

  describe("encode", () => {
    test("should encode", () => {
      const buf = new BufferT(2);
      const stream = new EncodeStream(new Uint8Array(4));
      buf.encode(stream, new Uint8Array([0xab, 0xff]));
      buf.encode(stream, new Uint8Array([0x1f, 0xb6]));
      expect(stream.buffer).to.deep.equal(new Uint8Array([0xab, 0xff, 0x1f, 0xb6]));
    });

    test("should encode length before buffer", () => {
      const buf = new BufferT(uint8);
      const stream = new EncodeStream(new Uint8Array(3));
      buf.encode(stream, new Uint8Array([0xab, 0xff]));
      expect(stream.buffer).to.deep.equal(new Uint8Array([2, 0xab, 0xff]));
    });
  });
});
