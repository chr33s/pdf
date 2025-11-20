import { describe, expect, it } from "vitest";
import {
  DecodeStream,
  EncodeStream,
  Pointer,
  String as StringT,
  uint8,
  VersionedStruct,
} from "../src";
import { expectStream } from "./helpers";

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
    it("should get version from number type", () => {
      const stream0 = new DecodeStream(
        Buffer.from("\x00\x05devon\x15", "binary"),
      );
      expect(baseStruct.decode(stream0)).to.deep.equal({
        version: 0,
        name: "devon",
        age: 21,
      });

      const stream1 = new DecodeStream(
        Buffer.from("\x01\x0adevon 👍\x15\x00", "utf8"),
      );
      expect(baseStruct.decode(stream1)).to.deep.equal({
        version: 1,
        name: "devon 👍",
        age: 21,
        gender: 0,
      });
    });

    it("should throw for unknown version", () => {
      const stream = new DecodeStream(
        Buffer.from("\x05\x05devon\x15", "binary"),
      );
      expect(() => baseStruct.decode(stream)).to.throw(/unknown version/i);
    });

    it("should support common header block", () => {
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

      const stream0 = new DecodeStream(
        Buffer.from("\x00\x15\x01\x05devon", "binary"),
      );
      expect(struct.decode(stream0)).to.deep.equal({
        version: 0,
        age: 21,
        alive: 1,
        name: "devon",
      });

      const stream1 = new DecodeStream(
        Buffer.from("\x01\x15\x01\x0adevon 👍\x00", "utf8"),
      );
      expect(struct.decode(stream1)).to.deep.equal({
        version: 1,
        age: 21,
        alive: 1,
        name: "devon 👍",
        gender: 0,
      });
    });

    it("should support parent version key", () => {
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

      const stream0 = new DecodeStream(Buffer.from("\x05devon\x15", "binary"));
      expect(struct.decode(stream0, { version: 0 })).to.deep.equal({
        version: 0,
        name: "devon",
        age: 21,
      });

      const stream1 = new DecodeStream(
        Buffer.from("\x0adevon 👍\x15\x00", "utf8"),
      );
      expect(struct.decode(stream1, { version: 1 })).to.deep.equal({
        version: 1,
        name: "devon 👍",
        age: 21,
        gender: 0,
      });
    });

    it("should support sub versioned structs", () => {
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

      const stream0 = new DecodeStream(
        Buffer.from("\x00\x05devon\x15", "binary"),
      );
      expect(struct.decode(stream0, { version: 0 })).to.deep.equal({
        version: 0,
        name: "devon",
        age: 21,
      });

      const stream1 = new DecodeStream(
        Buffer.from("\x01\x00\x05pasta", "binary"),
      );
      expect(struct.decode(stream1, { version: 0 })).to.deep.equal({
        version: 0,
        name: "pasta",
      });

      const stream2 = new DecodeStream(
        Buffer.from("\x01\x01\x09ice cream\x01", "binary"),
      );
      expect(struct.decode(stream2, { version: 0 })).to.deep.equal({
        version: 1,
        name: "ice cream",
        isDesert: 1,
      });
    });

    it("should support process hook", () => {
      const struct = baseStruct;
      struct.process = function process() {
        (this as any).processed = true;
      };

      const stream = new DecodeStream(
        Buffer.from("\x00\x05devon\x15", "binary"),
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
    it("should compute the correct size", () => {
      expect(baseStruct.size({ version: 0, name: "devon", age: 21 })).to.equal(
        8,
      );
      expect(
        baseStruct.size({ version: 1, name: "devon 👍", age: 21, gender: 0 }),
      ).to.equal(14);
    });

    it("should throw for unknown version", () => {
      expect(() =>
        baseStruct.size({ version: 5, name: "devon", age: 21 }),
      ).to.throw(/unknown version/i);
    });

    it("should support common header block", () => {
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

      expect(
        struct.size({ version: 0, age: 21, alive: 1, name: "devon" }),
      ).to.equal(9);
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

    it("should compute the correct size with pointers", () => {
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

      expect(
        struct.size({ version: 1, name: "devon", age: 21, ptr: "hello" }),
      ).to.equal(15);
    });

    it("should throw if no value is given", () => {
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
    it("should encode objects to buffers", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(
          Buffer.from("\x00\x05devon\x15\x01\x0adevon 👍\x15\x00", "utf8"),
        );
      });

      baseStruct.encode(stream, { version: 0, name: "devon", age: 21 });
      baseStruct.encode(stream, {
        version: 1,
        name: "devon 👍",
        age: 21,
        gender: 0,
      });
      stream.end();
      await expectation;
    });

    it("should throw for unknown version", () => {
      const stream = new EncodeStream();
      expect(() =>
        baseStruct.encode(stream, { version: 5, name: "devon", age: 21 }),
      ).to.throw(/unknown version/i);
    });

    it("should support common header block", async () => {
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

      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(
          Buffer.from(
            "\x00\x15\x01\x05devon\x01\x15\x01\x0adevon 👍\x00",
            "utf8",
          ),
        );
      });

      struct.encode(stream, { version: 0, age: 21, alive: 1, name: "devon" });
      struct.encode(stream, {
        version: 1,
        age: 21,
        alive: 1,
        name: "devon 👍",
        gender: 0,
      });
      stream.end();
      await expectation;
    });

    it("should encode pointer data after structure", async () => {
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

      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(
          Buffer.from("\x01\x05devon\x15\x09\x05hello", "utf8"),
        );
      });

      struct.encode(stream, {
        version: 1,
        name: "devon",
        age: 21,
        ptr: "hello",
      });
      stream.end();
      await expectation;
    });

    it("should support preEncode hook", async () => {
      const struct = baseStruct;
      struct.preEncode = function preEncode() {
        (this as any).version = (this as any).gender != null ? 1 : 0;
      };

      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(
          Buffer.from("\x00\x05devon\x15\x01\x0adevon 👍\x15\x00", "utf8"),
        );
      });

      struct.encode(stream, { name: "devon", age: 21 } as any);
      struct.encode(stream, { name: "devon 👍", age: 21, gender: 0 } as any);
      stream.end();
      await expectation;
    });
  });
});
