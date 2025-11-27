import { describe, expect, test } from "vitest";
import {
  DecodeStream,
  EncodeStream,
  Pointer,
  String as StringT,
  uint8,
  VersionedStruct,
} from "../src/index.js";

describe("VersionedStruct", () => {
  const baseStruct = new VersionedStruct(uint8, {
    0: {
      name: new StringT(uint8, "ascii"),
      age: uint8,
    },
    1: {
      name: new StringT(uint8, "utf8"),
      age: uint8,
      gender: uint8,
    },
  });

  describe("decode", () => {
    test("should get version from number type", () => {
      // \x00\x05devon\x15
      const stream0 = new DecodeStream(
        new Uint8Array([0x00, 0x05, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x15]),
      );
      expect(baseStruct.decode(stream0)).to.deep.equal({
        version: 0,
        name: "devon",
        age: 21,
      });

      // \x01\x0adevon 👍\x15\x00 in utf8
      const stream1 = new DecodeStream(
        new Uint8Array([
          0x01, 0x0a, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x20, 0xf0, 0x9f, 0x91, 0x8d, 0x15, 0x00,
        ]),
      );
      expect(baseStruct.decode(stream1)).to.deep.equal({
        version: 1,
        name: "devon 👍",
        age: 21,
        gender: 0,
      });
    });

    test("should throw for unknown version", () => {
      // \x05\x05devon\x15
      const stream = new DecodeStream(
        new Uint8Array([0x05, 0x05, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x15]),
      );
      expect(() => baseStruct.decode(stream)).to.throw(/unknown version/i);
    });

    test("should support common header block", () => {
      const struct = new VersionedStruct(uint8, {
        header: {
          age: uint8,
          alive: uint8,
        },
        0: {
          name: new StringT(uint8, "ascii"),
        },
        1: {
          name: new StringT(uint8, "utf8"),
          gender: uint8,
        },
      });

      // \x00\x15\x01\x05devon
      const stream0 = new DecodeStream(
        new Uint8Array([0x00, 0x15, 0x01, 0x05, 0x64, 0x65, 0x76, 0x6f, 0x6e]),
      );
      expect(struct.decode(stream0)).to.deep.equal({
        version: 0,
        age: 21,
        alive: 1,
        name: "devon",
      });

      // \x01\x15\x01\x0adevon 👍\x00 in utf8
      const stream1 = new DecodeStream(
        new Uint8Array([
          0x01, 0x15, 0x01, 0x0a, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x20, 0xf0, 0x9f, 0x91, 0x8d, 0x00,
        ]),
      );
      expect(struct.decode(stream1)).to.deep.equal({
        version: 1,
        age: 21,
        alive: 1,
        name: "devon 👍",
        gender: 0,
      });
    });

    test("should support parent version key", () => {
      const struct = new VersionedStruct("version", {
        0: {
          name: new StringT(uint8, "ascii"),
          age: uint8,
        },
        1: {
          name: new StringT(uint8, "utf8"),
          age: uint8,
          gender: uint8,
        },
      });

      // \x05devon\x15
      const stream0 = new DecodeStream(new Uint8Array([0x05, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x15]));
      expect(struct.decode(stream0, { version: 0 })).to.deep.equal({
        version: 0,
        name: "devon",
        age: 21,
      });

      // \x0adevon 👍\x15\x00 in utf8
      const stream1 = new DecodeStream(
        new Uint8Array([
          0x0a, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x20, 0xf0, 0x9f, 0x91, 0x8d, 0x15, 0x00,
        ]),
      );
      expect(struct.decode(stream1, { version: 1 })).to.deep.equal({
        version: 1,
        name: "devon 👍",
        age: 21,
        gender: 0,
      });
    });

    test("should support sub versioned structs", () => {
      const struct = new VersionedStruct(uint8, {
        0: {
          name: new StringT(uint8, "ascii"),
          age: uint8,
        },
        1: new VersionedStruct(uint8, {
          0: {
            name: new StringT(uint8),
          },
          1: {
            name: new StringT(uint8),
            isDesert: uint8,
          },
        }),
      });

      // \x00\x05devon\x15
      const stream0 = new DecodeStream(
        new Uint8Array([0x00, 0x05, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x15]),
      );
      expect(struct.decode(stream0, { version: 0 })).to.deep.equal({
        version: 0,
        name: "devon",
        age: 21,
      });

      // \x01\x00\x05pasta
      const stream1 = new DecodeStream(
        new Uint8Array([0x01, 0x00, 0x05, 0x70, 0x61, 0x73, 0x74, 0x61]),
      );
      expect(struct.decode(stream1, { version: 0 })).to.deep.equal({
        version: 0,
        name: "pasta",
      });

      // \x01\x01\x09ice cream\x01
      const stream2 = new DecodeStream(
        new Uint8Array([
          0x01, 0x01, 0x09, 0x69, 0x63, 0x65, 0x20, 0x63, 0x72, 0x65, 0x61, 0x6d, 0x01,
        ]),
      );
      expect(struct.decode(stream2, { version: 0 })).to.deep.equal({
        version: 1,
        name: "ice cream",
        isDesert: 1,
      });
    });

    test("should support process hook", () => {
      const struct = baseStruct;
      struct.process = function process() {
        (this as any).processed = true;
      };

      // \x00\x05devon\x15
      const stream = new DecodeStream(
        new Uint8Array([0x00, 0x05, 0x64, 0x65, 0x76, 0x6f, 0x6e, 0x15]),
      );
      expect(struct.decode(stream)).to.deep.equal({
        version: 0,
        name: "devon",
        age: 21,
        processed: true,
      });
    });
  });

  describe("size", () => {
    test("should compute the correct size", () => {
      expect(baseStruct.size({ version: 0, name: "devon", age: 21 })).to.equal(8);
      expect(baseStruct.size({ version: 1, name: "devon 👍", age: 21, gender: 0 })).to.equal(14);
    });

    test("should throw for unknown version", () => {
      expect(() => baseStruct.size({ version: 5, name: "devon", age: 21 })).to.throw(
        /unknown version/i,
      );
    });

    test("should support common header block", () => {
      const struct = new VersionedStruct(uint8, {
        header: {
          age: uint8,
          alive: uint8,
        },
        0: {
          name: new StringT(uint8, "ascii"),
        },
        1: {
          name: new StringT(uint8, "utf8"),
          gender: uint8,
        },
      });

      expect(struct.size({ version: 0, age: 21, alive: 1, name: "devon" })).to.equal(9);
      expect(
        struct.size({
          version: 1,
          age: 21,
          alive: 1,
          name: "devon 👍",
          gender: 0,
        }),
      ).to.equal(15);
    });

    test("should compute the correct size with pointers", () => {
      const struct = new VersionedStruct(uint8, {
        0: {
          name: new StringT(uint8, "ascii"),
          age: uint8,
        },
        1: {
          name: new StringT(uint8, "utf8"),
          age: uint8,
          ptr: new Pointer(uint8, new StringT(uint8)),
        },
      });

      expect(struct.size({ version: 1, name: "devon", age: 21, ptr: "hello" })).to.equal(15);
    });

    test("should throw if no value is given", () => {
      const struct = new VersionedStruct(uint8, {
        0: {
          name: new StringT(4, "ascii"),
          age: uint8,
        },
        1: {
          name: new StringT(4, "utf8"),
          age: uint8,
          gender: uint8,
        },
      });

      expect(() => struct.size(undefined as any)).to.throw(/not a fixed size/i);
    });
  });

  describe("encode", () => {
    test("should encode objects to buffers", () => {
      const value1 = { version: 0, name: "devon", age: 21 };
      const value2 = { version: 1, name: "devon 👍", age: 21, gender: 0 };
      const totalSize = baseStruct.size(value1) + baseStruct.size(value2);
      const stream = new EncodeStream(new Uint8Array(totalSize));

      baseStruct.encode(stream, value1);
      baseStruct.encode(stream, value2);

      // \x00\x05devon\x15\x01\x0adevon 👍\x15\x00
      expect(stream.buffer).to.deep.equal(
        new Uint8Array([
          0x00,
          0x05,
          0x64,
          0x65,
          0x76,
          0x6f,
          0x6e,
          0x15, // version 0
          0x01,
          0x0a,
          0x64,
          0x65,
          0x76,
          0x6f,
          0x6e,
          0x20,
          0xf0,
          0x9f,
          0x91,
          0x8d,
          0x15,
          0x00, // version 1
        ]),
      );
    });

    test("should throw for unknown version", () => {
      const stream = new EncodeStream(new Uint8Array(100));
      expect(() => baseStruct.encode(stream, { version: 5, name: "devon", age: 21 })).to.throw(
        /unknown version/i,
      );
    });

    test("should support common header block", () => {
      const struct = new VersionedStruct(uint8, {
        header: {
          age: uint8,
          alive: uint8,
        },
        0: {
          name: new StringT(uint8, "ascii"),
        },
        1: {
          name: new StringT(uint8, "utf8"),
          gender: uint8,
        },
      });

      const value1 = { version: 0, age: 21, alive: 1, name: "devon" };
      const value2 = { version: 1, age: 21, alive: 1, name: "devon 👍", gender: 0 };
      const totalSize = struct.size(value1) + struct.size(value2);
      const stream = new EncodeStream(new Uint8Array(totalSize));

      struct.encode(stream, value1);
      struct.encode(stream, value2);

      // \x00\x15\x01\x05devon\x01\x15\x01\x0adevon 👍\x00
      expect(stream.buffer).to.deep.equal(
        new Uint8Array([
          0x00,
          0x15,
          0x01,
          0x05,
          0x64,
          0x65,
          0x76,
          0x6f,
          0x6e, // version 0
          0x01,
          0x15,
          0x01,
          0x0a,
          0x64,
          0x65,
          0x76,
          0x6f,
          0x6e,
          0x20,
          0xf0,
          0x9f,
          0x91,
          0x8d,
          0x00, // version 1
        ]),
      );
    });

    test("should encode pointer data after structure", () => {
      const struct = new VersionedStruct(uint8, {
        0: {
          name: new StringT(uint8, "ascii"),
          age: uint8,
        },
        1: {
          name: new StringT(uint8, "utf8"),
          age: uint8,
          ptr: new Pointer(uint8, new StringT(uint8)),
        },
      });

      const value = { version: 1, name: "devon", age: 21, ptr: "hello" };
      const stream = new EncodeStream(new Uint8Array(struct.size(value)));
      struct.encode(stream, value);

      // \x01\x05devon\x15\x09\x05hello
      expect(stream.buffer).to.deep.equal(
        new Uint8Array([
          0x01,
          0x05,
          0x64,
          0x65,
          0x76,
          0x6f,
          0x6e, // \x01\x05devon
          0x15, // age: 21
          0x09, // pointer offset
          0x05,
          0x68,
          0x65,
          0x6c,
          0x6c,
          0x6f, // \x05hello
        ]),
      );
    });

    test("should support preEncode hook", () => {
      const struct = baseStruct;
      struct.preEncode = function preEncode() {
        (this as any).version = (this as any).gender != null ? 1 : 0;
      };

      const value1 = { name: "devon", age: 21 } as any;
      const value2 = { name: "devon 👍", age: 21, gender: 0 } as any;
      // Need to compute sizes after preEncode would set version
      value1.version = 0;
      value2.version = 1;
      const totalSize = struct.size(value1) + struct.size(value2);
      const stream = new EncodeStream(new Uint8Array(totalSize));

      // Reset versions for encode to set them via preEncode
      delete value1.version;
      delete value2.version;
      struct.encode(stream, value1);
      struct.encode(stream, value2);

      // \x00\x05devon\x15\x01\x0adevon 👍\x15\x00
      expect(stream.buffer).to.deep.equal(
        new Uint8Array([
          0x00,
          0x05,
          0x64,
          0x65,
          0x76,
          0x6f,
          0x6e,
          0x15, // version 0
          0x01,
          0x0a,
          0x64,
          0x65,
          0x76,
          0x6f,
          0x6e,
          0x20,
          0xf0,
          0x9f,
          0x91,
          0x8d,
          0x15,
          0x00, // version 1
        ]),
      );
    });
  });
});
