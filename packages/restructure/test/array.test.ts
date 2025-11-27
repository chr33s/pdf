import { describe, expect, test } from "vitest";
import { Array as ArrayT, DecodeStream, Pointer, uint16, uint8 } from "../src/index.js";

describe("Array", () => {
  describe("decode", () => {
    test("should decode fixed length", () => {
      const array = new ArrayT(uint8, 4);
      expect(array.fromBuffer(new Uint8Array([1, 2, 3, 4, 5]))).to.deep.equal([1, 2, 3, 4]);
    });

    test("should decode fixed amount of bytes", () => {
      const array = new ArrayT(uint16, 4, "bytes");
      expect(array.fromBuffer(new Uint8Array([1, 2, 3, 4, 5]))).to.deep.equal([258, 772]);
    });

    test("should decode length from parent key", () => {
      const stream = new DecodeStream(new Uint8Array([1, 2, 3, 4, 5]));
      const array = new ArrayT(uint8, "len");
      expect(array.decode(stream, { len: 4 })).to.deep.equal([1, 2, 3, 4]);
    });

    test("should decode amount of bytes from parent key", () => {
      const stream = new DecodeStream(new Uint8Array([1, 2, 3, 4, 5]));
      const array = new ArrayT(uint16, "len", "bytes");
      expect(array.decode(stream, { len: 4 })).to.deep.equal([258, 772]);
    });

    test("should decode length as number before array", () => {
      const array = new ArrayT(uint8, uint8);
      expect(array.fromBuffer(new Uint8Array([4, 1, 2, 3, 4, 5]))).to.deep.equal([1, 2, 3, 4]);
    });

    test("should decode amount of bytes as number before array", () => {
      const array = new ArrayT(uint16, uint8, "bytes");
      expect(array.fromBuffer(new Uint8Array([4, 1, 2, 3, 4, 5]))).to.deep.equal([258, 772]);
    });

    test("should decode length from function", () => {
      const array = new ArrayT(uint8, () => 4);
      expect(array.fromBuffer(new Uint8Array([1, 2, 3, 4, 5]))).to.deep.equal([1, 2, 3, 4]);
    });

    test("should decode amount of bytes from function", () => {
      const array = new ArrayT(uint16, () => 4, "bytes");
      expect(array.fromBuffer(new Uint8Array([1, 2, 3, 4, 5]))).to.deep.equal([258, 772]);
    });

    test("should decode to the end of the parent if no length is given", () => {
      const stream = new DecodeStream(new Uint8Array([1, 2, 3, 4, 5]));
      const array = new ArrayT(uint8);
      expect(array.decode(stream, { _length: 4, _startOffset: 0 })).to.deep.equal([1, 2, 3, 4]);
    });

    test("should decode to the end of the stream if no parent and length is given", () => {
      const array = new ArrayT(uint8);
      expect(array.fromBuffer(new Uint8Array([1, 2, 3, 4]))).to.deep.equal([1, 2, 3, 4]);
    });
  });

  describe("size", () => {
    test("should use array length", () => {
      const array = new ArrayT(uint8, 10);
      expect(array.size([1, 2, 3, 4])).to.equal(4);
    });

    test("should add size of length field before string", () => {
      const array = new ArrayT(uint8, uint8);
      expect(array.size([1, 2, 3, 4])).to.equal(5);
    });

    test("should use defined length if no value given", () => {
      const array = new ArrayT(uint8, 10);
      expect(array.size()).to.equal(10);
    });
  });

  describe("encode", () => {
    test("should encode using array length", () => {
      const array = new ArrayT(uint8, 10);
      expect(array.toBuffer([1, 2, 3, 4])).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
    });

    test("should encode length as number before array", () => {
      const array = new ArrayT(uint8, uint8);
      expect(array.toBuffer([1, 2, 3, 4])).to.deep.equal(new Uint8Array([4, 1, 2, 3, 4]));
    });

    test("should add pointers after array if length is encoded at start", () => {
      const array = new ArrayT(new Pointer(uint8, uint8), uint8);
      expect(array.toBuffer([1, 2, 3, 4])).to.deep.equal(
        new Uint8Array([4, 5, 6, 7, 8, 1, 2, 3, 4]),
      );
    });
  });
});
