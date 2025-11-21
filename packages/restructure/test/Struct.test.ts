import { describe, expect, it } from "vitest";
import {
  DecodeStream,
  EncodeStream,
  Pointer,
  String as StringT,
  Struct,
  uint8,
} from "../src/index.js";
import { expectStream } from "./helpers.js";

describe("Struct", () => {
  describe("decode", () => {
    it("should decode into an object", () => {
      const stream = new DecodeStream(Buffer.from("\x05devon\x15", "binary"));
      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
      });

      expect(struct.decode(stream)).to.deep.equal({ name: "devon", age: 21 });
    });

    it("should support process hook", () => {
      const stream = new DecodeStream(Buffer.from("\x05devon\x20", "binary"));
      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
      });

      struct.process = function process() {
        (this as any).canDrink = (this as any).age >= 21;
      };

      expect(struct.decode(stream)).to.deep.equal({
        name: "devon",
        age: 32,
        canDrink: true,
      });
    });

    it("should support function keys", () => {
      const stream = new DecodeStream(Buffer.from("\x05devon\x20", "binary"));
      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
        canDrink() {
          return (this as any).age >= 21;
        },
      });

      expect(struct.decode(stream)).to.deep.equal({
        name: "devon",
        age: 32,
        canDrink: true,
      });
    });
  });

  describe("size", () => {
    it("should compute the correct size", () => {
      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
      });

      expect(struct.size({ name: "devon", age: 21 })).to.equal(7);
    });

    it("should compute the correct size with pointers", () => {
      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
        ptr: new Pointer(uint8, new StringT(uint8)),
      });

      const size = struct.size({ name: "devon", age: 21, ptr: "hello" });
      expect(size).to.equal(14);
    });

    it("should get the correct size when no value is given", () => {
      const struct = new Struct({
        name: new StringT(4),
        age: uint8,
      });

      expect(struct.size()).to.equal(5);
    });

    it("should throw when getting non-fixed length size and no value is given", () => {
      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
      });

      expect(() => struct.size()).to.throw(/not a fixed size/i);
    });
  });

  describe("encode", () => {
    it("should encode objects to buffers", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from("\x05devon\x15", "binary"));
      });

      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
      });

      struct.encode(stream, { name: "devon", age: 21 });
      stream.end();
      await expectation;
    });

    it("should support preEncode hook", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from("\x05devon\x15", "binary"));
      });

      const struct = new Struct({
        nameLength: uint8,
        name: new StringT("nameLength"),
        age: uint8,
      });

      struct.preEncode = function preEncode() {
        (this as any).nameLength = (this as any).name.length;
      };

      struct.encode(stream, { name: "devon", age: 21 } as any);
      stream.end();
      await expectation;
    });

    it("should encode pointer data after structure", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(
          Buffer.from("\x05devon\x15\x08\x05hello", "binary"),
        );
      });

      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
        ptr: new Pointer(uint8, new StringT(uint8)),
      });

      struct.encode(stream, { name: "devon", age: 21, ptr: "hello" });
      stream.end();
      await expectation;
    });
  });
});
