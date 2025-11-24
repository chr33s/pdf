import { describe, expect, it } from "vitest";
import {
  Array as ArrayT,
  DecodeStream,
  EncodeStream,
  Pointer,
  uint16,
  uint8,
} from "../src/index.js";
import { expectStream } from "./helpers.js";

describe("Array", () => {
  describe("decode", () => {
    it("should decode fixed length", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4, 5]));
      const array = new ArrayT(uint8, 4);
      expect(array.decode(stream)).to.deep.equal([1, 2, 3, 4]);
    });

    it("should decode fixed amount of bytes", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4, 5]));
      const array = new ArrayT(uint16, 4, "bytes");
      expect(array.decode(stream)).to.deep.equal([258, 772]);
    });

    it("should decode length from parent key", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4, 5]));
      const array = new ArrayT(uint8, "len");
      expect(array.decode(stream, { len: 4 })).to.deep.equal([1, 2, 3, 4]);
    });

    it("should decode amount of bytes from parent key", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4, 5]));
      const array = new ArrayT(uint16, "len", "bytes");
      expect(array.decode(stream, { len: 4 })).to.deep.equal([258, 772]);
    });

    it("should decode length as number before array", () => {
      const stream = new DecodeStream(Buffer.from([4, 1, 2, 3, 4, 5]));
      const array = new ArrayT(uint8, uint8);
      expect(array.decode(stream)).to.deep.equal([1, 2, 3, 4]);
    });

    it("should decode amount of bytes as number before array", () => {
      const stream = new DecodeStream(Buffer.from([4, 1, 2, 3, 4, 5]));
      const array = new ArrayT(uint16, uint8, "bytes");
      expect(array.decode(stream)).to.deep.equal([258, 772]);
    });

    it("should decode length from function", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4, 5]));
      const array = new ArrayT(uint8, () => 4);
      expect(array.decode(stream)).to.deep.equal([1, 2, 3, 4]);
    });

    it("should decode amount of bytes from function", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4, 5]));
      const array = new ArrayT(uint16, () => 4, "bytes");
      expect(array.decode(stream)).to.deep.equal([258, 772]);
    });

    it("should decode to the end of the parent if no length is given", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4, 5]));
      const array = new ArrayT(uint8);
      expect(
        array.decode(stream, { _length: 4, _startOffset: 0 }),
      ).to.deep.equal([1, 2, 3, 4]);
    });

    it("should decode to the end of the stream if no parent and length is given", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4]));
      const array = new ArrayT(uint8);
      expect(array.decode(stream)).to.deep.equal([1, 2, 3, 4]);
    });
  });

  describe("size", () => {
    it("should use array length", () => {
      const array = new ArrayT(uint8, 10);
      expect(array.size([1, 2, 3, 4])).to.equal(4);
    });

    it("should add size of length field before string", () => {
      const array = new ArrayT(uint8, uint8);
      expect(array.size([1, 2, 3, 4])).to.equal(5);
    });

    it("should use defined length if no value given", () => {
      const array = new ArrayT(uint8, 10);
      expect(array.size()).to.equal(10);
    });
  });

  describe("encode", () => {
    it("should encode using array length", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([1, 2, 3, 4]));
      });

      const array = new ArrayT(uint8, 10);
      array.encode(stream, [1, 2, 3, 4]);
      stream.end();

      await expectation;
    });

    it("should encode length as number before array", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([4, 1, 2, 3, 4]));
      });

      const array = new ArrayT(uint8, uint8);
      array.encode(stream, [1, 2, 3, 4]);
      stream.end();

      await expectation;
    });

    it("should add pointers after array if length is encoded at start", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([4, 5, 6, 7, 8, 1, 2, 3, 4]));
      });

      const array = new ArrayT(new Pointer(uint8, uint8), uint8);
      array.encode(stream, [1, 2, 3, 4]);
      stream.end();

      await expectation;
    });
  });
});
