import { describe, expect, it } from "vitest";
import {
  DecodeStream,
  EncodeStream,
  LazyArray as LazyArrayT,
  uint8,
} from "../src";
import { expectStream } from "./helpers";

describe("LazyArray", () => {
  describe("decode", () => {
    it("should decode items lazily", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4, 5]));
      const array = new LazyArrayT(uint8, 4);

      const arr = array.decode(stream);
      expect(arr).to.not.be.an("array");
      expect(arr).to.have.length(4);
      expect(stream.pos).to.equal(4);

      expect(arr.get(0)).to.equal(1);
      expect(arr.get(1)).to.equal(2);
      expect(arr.get(2)).to.equal(3);
      expect(arr.get(3)).to.equal(4);

      expect(arr.get(-1)).to.equal(undefined);
      expect(arr.get(5)).to.equal(undefined);
    });

    it("should be able to convert to an array", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4, 5]));
      const array = new LazyArrayT(uint8, 4);
      const arr = array.decode(stream);

      expect(arr.toArray()).to.deep.equal([1, 2, 3, 4]);
    });

    it("should have an inspect method", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4, 5]));
      const array = new LazyArrayT(uint8, 4);
      const arr = array.decode(stream);

      expect(arr.inspect()).to.equal("[ 1, 2, 3, 4 ]");
    });

    it("should decode length as number before array", () => {
      const stream = new DecodeStream(Buffer.from([4, 1, 2, 3, 4, 5]));
      const array = new LazyArrayT(uint8, uint8);
      const arr = array.decode(stream);

      expect(arr.toArray()).to.deep.equal([1, 2, 3, 4]);
    });
  });

  describe("size", () => {
    it("should work with LazyArrays", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4, 5]));
      const array = new LazyArrayT(uint8, 4);
      const arr = array.decode(stream);

      expect(array.size(arr)).to.equal(4);
    });
  });

  describe("encode", () => {
    it("should work with LazyArrays", async () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3, 4, 5]));
      const array = new LazyArrayT(uint8, 4);
      const arr = array.decode(stream);

      const enc = new EncodeStream();
      const expectation = expectStream(enc, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([1, 2, 3, 4]));
      });

      array.encode(enc, arr);
      enc.end();
      await expectation;
    });
  });
});
