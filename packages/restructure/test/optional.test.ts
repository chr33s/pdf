import { describe, expect, test } from "vitest";
import { DecodeStream, EncodeStream, Optional, uint8 } from "../src/index.js";

describe("Optional", () => {
  describe("decode", () => {
    test("should not decode when condition is falsy", () => {
      const stream = new DecodeStream(new Uint8Array([0]));
      const optional = new Optional(uint8, false);
      expect(optional.decode(stream)).to.equal(undefined);
      expect(stream.pos).to.equal(0);
    });

    test("should not decode when condition is a function and falsy", () => {
      const stream = new DecodeStream(new Uint8Array([0]));
      const optional = new Optional(uint8, () => false);
      expect(optional.decode(stream)).to.equal(undefined);
      expect(stream.pos).to.equal(0);
    });

    test("should decode when condition is omitted", () => {
      const stream = new DecodeStream(new Uint8Array([0]));
      const optional = new Optional(uint8);
      expect(optional.decode(stream)).to.equal(0);
      expect(stream.pos).to.equal(1);
    });

    test("should decode when condition is truthy", () => {
      const stream = new DecodeStream(new Uint8Array([0]));
      const optional = new Optional(uint8, true);
      expect(optional.decode(stream)).to.equal(0);
      expect(stream.pos).to.equal(1);
    });

    test("should decode when condition is a function and truthy", () => {
      const stream = new DecodeStream(new Uint8Array([0]));
      const optional = new Optional(uint8, () => true);
      expect(optional.decode(stream)).to.equal(0);
      expect(stream.pos).to.equal(1);
    });
  });

  describe("size", () => {
    test("should return 0 when condition is falsy", () => {
      const optional = new Optional(uint8, false);
      expect(optional.size()).to.equal(0);
    });

    test("should return 0 when condition is a function and falsy", () => {
      const optional = new Optional(uint8, () => false);
      expect(optional.size()).to.equal(0);
    });

    test("should return given type size when condition is omitted", () => {
      const optional = new Optional(uint8);
      expect(optional.size()).to.equal(1);
    });

    test("should return given type size when condition is truthy", () => {
      const optional = new Optional(uint8, true);
      expect(optional.size()).to.equal(1);
    });

    test("should return given type size when condition is a function and truthy", () => {
      const optional = new Optional(uint8, () => true);
      expect(optional.size()).to.equal(1);
    });
  });

  describe("encode", () => {
    test("should not encode when condition is falsy", () => {
      const optional = new Optional(uint8, false);
      const stream = new EncodeStream(new Uint8Array(0));
      optional.encode(stream, 128);
      expect(stream.buffer).to.deep.equal(new Uint8Array(0));
    });

    test("should not encode when condition is a function and falsy", () => {
      const optional = new Optional(uint8, () => false);
      const stream = new EncodeStream(new Uint8Array(0));
      optional.encode(stream, 128);
      expect(stream.buffer).to.deep.equal(new Uint8Array(0));
    });

    test("should encode when condition is omitted", () => {
      const optional = new Optional(uint8);
      const stream = new EncodeStream(new Uint8Array(1));
      optional.encode(stream, 128);
      expect(stream.buffer).to.deep.equal(new Uint8Array([128]));
    });

    test("should encode when condition is truthy", () => {
      const optional = new Optional(uint8, true);
      const stream = new EncodeStream(new Uint8Array(1));
      optional.encode(stream, 128);
      expect(stream.buffer).to.deep.equal(new Uint8Array([128]));
    });

    test("should encode when condition is a function and truthy", () => {
      const optional = new Optional(uint8, () => true);
      const stream = new EncodeStream(new Uint8Array(1));
      optional.encode(stream, 128);
      expect(stream.buffer).to.deep.equal(new Uint8Array([128]));
    });
  });
});
