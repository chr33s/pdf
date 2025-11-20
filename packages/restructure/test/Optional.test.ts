import { describe, expect, it } from "vitest";
import { DecodeStream, EncodeStream, Optional, uint8 } from "../src";
import { expectStream } from "./helpers";

describe("Optional", () => {
  describe("decode", () => {
    it("should not decode when condition is falsy", () => {
      const stream = new DecodeStream(Buffer.from([0]));
      const optional = new Optional(uint8, false);
      expect(optional.decode(stream)).to.equal(undefined);
      expect(stream.pos).to.equal(0);
    });

    it("should not decode when condition is a function and falsy", () => {
      const stream = new DecodeStream(Buffer.from([0]));
      const optional = new Optional(uint8, () => false);
      expect(optional.decode(stream)).to.equal(undefined);
      expect(stream.pos).to.equal(0);
    });

    it("should decode when condition is omitted", () => {
      const stream = new DecodeStream(Buffer.from([0]));
      const optional = new Optional(uint8);
      expect(optional.decode(stream)).to.equal(0);
      expect(stream.pos).to.equal(1);
    });

    it("should decode when condition is truthy", () => {
      const stream = new DecodeStream(Buffer.from([0]));
      const optional = new Optional(uint8, true);
      expect(optional.decode(stream)).to.equal(0);
      expect(stream.pos).to.equal(1);
    });

    it("should decode when condition is a function and truthy", () => {
      const stream = new DecodeStream(Buffer.from([0]));
      const optional = new Optional(uint8, () => true);
      expect(optional.decode(stream)).to.equal(0);
      expect(stream.pos).to.equal(1);
    });
  });

  describe("size", () => {
    it("should return 0 when condition is falsy", () => {
      const optional = new Optional(uint8, false);
      expect(optional.size()).to.equal(0);
    });

    it("should return 0 when condition is a function and falsy", () => {
      const optional = new Optional(uint8, () => false);
      expect(optional.size()).to.equal(0);
    });

    it("should return given type size when condition is omitted", () => {
      const optional = new Optional(uint8);
      expect(optional.size()).to.equal(1);
    });

    it("should return given type size when condition is truthy", () => {
      const optional = new Optional(uint8, true);
      expect(optional.size()).to.equal(1);
    });

    it("should return given type size when condition is a function and truthy", () => {
      const optional = new Optional(uint8, () => true);
      expect(optional.size()).to.equal(1);
    });
  });

  describe("encode", () => {
    it("should not encode when condition is falsy", async () => {
      const stream = new EncodeStream();
      const optional = new Optional(uint8, false);
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.alloc(0));
      });

      optional.encode(stream, 128);
      stream.end();
      await expectation;
    });

    it("should not encode when condition is a function and falsy", async () => {
      const stream = new EncodeStream();
      const optional = new Optional(uint8, () => false);
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.alloc(0));
      });

      optional.encode(stream, 128);
      stream.end();
      await expectation;
    });

    it("should encode when condition is omitted", async () => {
      const stream = new EncodeStream();
      const optional = new Optional(uint8);
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([128]));
      });

      optional.encode(stream, 128);
      stream.end();
      await expectation;
    });

    it("should encode when condition is truthy", async () => {
      const stream = new EncodeStream();
      const optional = new Optional(uint8, true);
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([128]));
      });

      optional.encode(stream, 128);
      stream.end();
      await expectation;
    });

    it("should encode when condition is a function and truthy", async () => {
      const stream = new EncodeStream();
      const optional = new Optional(uint8, () => true);
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([128]));
      });

      optional.encode(stream, 128);
      stream.end();
      await expectation;
    });
  });
});
