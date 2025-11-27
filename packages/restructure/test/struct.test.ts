import { describe, expect, test } from "vitest";
import {
  DecodeStream,
  EncodeStream,
  Pointer,
  String as StringT,
  Struct,
  uint8,
} from "../src/index.js";

describe("Struct", () => {
  describe("decode", () => {
    test("should decode into an object", () => {
      const stream = new DecodeStream(new Uint8Array([0x05, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x15])); // \x05devon\x15
      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
      });

      expect(struct.decode(stream)).to.deep.equal({ name: "devon", age: 21 });
    });

    test("should support process hook", () => {
      const stream = new DecodeStream(new Uint8Array([0x05, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x20])); // \x05devon\x20
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

    test("should support function keys", () => {
      const stream = new DecodeStream(new Uint8Array([0x05, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x20])); // \x05devon\x20
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
    test("should compute the correct size", () => {
      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
      });

      expect(struct.size({ name: "devon", age: 21 })).to.equal(7);
    });

    test("should compute the correct size with pointers", () => {
      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
        ptr: new Pointer(uint8, new StringT(uint8)),
      });

      const size = struct.size({ name: "devon", age: 21, ptr: "hello" });
      expect(size).to.equal(14);
    });

    test("should get the correct size when no value is given", () => {
      const struct = new Struct({
        name: new StringT(4),
        age: uint8,
      });

      expect(struct.size()).to.equal(5);
    });

    test("should throw when getting non-fixed length size and no value is given", () => {
      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
      });

      expect(() => struct.size()).to.throw(/not a fixed size/i);
    });
  });

  describe("encode", () => {
    test("should encode objects to buffers", () => {
      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
      });

      const value = { name: "devon", age: 21 };
      const stream = new EncodeStream(new Uint8Array(struct.size(value)));
      struct.encode(stream, value);
      expect(stream.buffer).to.deep.equal(
        new Uint8Array([0x05, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x15]),
      );
    });

    test("should support preEncode hook", () => {
      const struct = new Struct({
        nameLength: uint8,
        name: new StringT("nameLength"),
        age: uint8,
      });

      struct.preEncode = function preEncode() {
        (this as any).nameLength = (this as any).name.length;
      };

      const value = { name: "devon", age: 21 } as any;
      const stream = new EncodeStream(new Uint8Array(struct.size(value)));
      struct.encode(stream, value);
      expect(stream.buffer).to.deep.equal(
        new Uint8Array([0x05, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x15]),
      );
    });

    test("should encode pointer data after structure", () => {
      const struct = new Struct({
        name: new StringT(uint8),
        age: uint8,
        ptr: new Pointer(uint8, new StringT(uint8)),
      });

      const value = { name: "devon", age: 21, ptr: "hello" };
      const stream = new EncodeStream(new Uint8Array(struct.size(value)));
      struct.encode(stream, value);
      // \x05devon\x15\x08\x05hello
      expect(stream.buffer).to.deep.equal(
        new Uint8Array([
          0x05,
          0x64,
          0x65,
          0x76,
          0x6f,
          0x6e, // \x05devon
          0x15, // age: 21
          0x08, // pointer offset
          0x05,
          0x68,
          0x65,
          0x6c,
          0x6c,
          0x6f, // \x05hello
        ]),
      );
    });
  });
});
