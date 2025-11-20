import { describe, expect, it } from "vitest";
import {
  DecodeStream,
  EncodeStream,
  Pointer,
  Struct,
  VoidPointer,
  uint8,
} from "../src";
import { expectStream } from "./helpers";

describe("Pointer", () => {
  describe("decode", () => {
    it("should handle null pointers", () => {
      const stream = new DecodeStream(Buffer.from([0]));
      const pointer = new Pointer(uint8, uint8);
      expect(pointer.decode(stream, { _startOffset: 50 })).to.equal(null);
    });

    it("should use local offsets from start of parent by default", () => {
      const stream = new DecodeStream(Buffer.from([1, 53]));
      const pointer = new Pointer(uint8, uint8);
      expect(pointer.decode(stream, { _startOffset: 0 })).to.equal(53);
    });

    it("should support immediate offsets", () => {
      const stream = new DecodeStream(Buffer.from([1, 53]));
      const pointer = new Pointer(uint8, uint8, { type: "immediate" });
      expect(pointer.decode(stream, {})).to.equal(53);
    });

    it("should support offsets relative to the parent", () => {
      const stream = new DecodeStream(Buffer.from([0, 0, 1, 53]));
      stream.pos = 2;
      const pointer = new Pointer(uint8, uint8, { type: "parent" });
      expect(pointer.decode(stream, { parent: { _startOffset: 2 } })).to.equal(
        53,
      );
    });

    it("should support global offsets", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 4, 0, 0, 0, 53]));
      const pointer = new Pointer(uint8, uint8, { type: "global" });
      stream.pos = 2;
      expect(
        pointer.decode(stream, { parent: { parent: { _startOffset: 2 } } }),
      ).to.equal(53);
    });

    it("should support offsets relative to a property on the parent", () => {
      const stream = new DecodeStream(Buffer.from([1, 0, 0, 0, 0, 53]));
      const pointer = new Pointer(uint8, uint8, { relativeTo: "parent.ptr" });
      expect(
        pointer.decode(stream, { _startOffset: 0, parent: { ptr: 4 } }),
      ).to.equal(53);
    });

    it("should support returning pointer if there is no decode type", () => {
      const stream = new DecodeStream(Buffer.from([4]));
      const pointer = new Pointer(uint8, "void");
      expect(pointer.decode(stream, { _startOffset: 0 })).to.equal(4);
    });

    it("should support decoding pointers lazily", () => {
      const stream = new DecodeStream(Buffer.from([1, 53]));
      const struct = new Struct({
        ptr: new Pointer(uint8, uint8, { lazy: true }),
      });

      const res = struct.decode(stream);
      const descriptor = Object.getOwnPropertyDescriptor(res, "ptr");
      expect(descriptor?.get).to.be.a("function");
      expect(descriptor?.enumerable).to.equal(true);
      expect(res.ptr).to.equal(53);
    });
  });

  describe("size", () => {
    it("should add to local pointerSize", () => {
      const pointer = new Pointer(uint8, uint8);
      const ctx: any = { pointerSize: 0 };
      expect(pointer.size(10, ctx)).to.equal(1);
      expect(ctx.pointerSize).to.equal(1);
    });

    it("should add to immediate pointerSize", () => {
      const pointer = new Pointer(uint8, uint8, { type: "immediate" });
      const ctx: any = { pointerSize: 0 };
      expect(pointer.size(10, ctx)).to.equal(1);
      expect(ctx.pointerSize).to.equal(1);
    });

    it("should add to parent pointerSize", () => {
      const pointer = new Pointer(uint8, uint8, { type: "parent" });
      const ctx: any = { parent: { pointerSize: 0 } };
      expect(pointer.size(10, ctx)).to.equal(1);
      expect(ctx.parent.pointerSize).to.equal(1);
    });

    it("should add to global pointerSize", () => {
      const pointer = new Pointer(uint8, uint8, { type: "global" });
      const ctx: any = { parent: { parent: { parent: { pointerSize: 0 } } } };
      expect(pointer.size(10, ctx)).to.equal(1);
      expect(ctx.parent.parent.parent.pointerSize).to.equal(1);
    });

    it("should handle void pointers", () => {
      const pointer = new Pointer(uint8, "void");
      const ctx: any = { pointerSize: 0 };
      expect(pointer.size(new VoidPointer(uint8, 50), ctx)).to.equal(1);
      expect(ctx.pointerSize).to.equal(1);
    });

    it("should throw if no type and not a void pointer", () => {
      const pointer = new Pointer(uint8, "void");
      const ctx: any = { pointerSize: 0 };
      expect(() => pointer.size(30, ctx)).to.throw();
    });

    it("should return a fixed size without a value", () => {
      const pointer = new Pointer(uint8, uint8);
      expect(pointer.size()).to.equal(1);
    });
  });

  describe("encode", () => {
    it("should handle null pointers", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([0]));
      });

      const ptr = new Pointer(uint8, uint8);
      const ctx: any = {
        pointerSize: 0,
        startOffset: 0,
        pointerOffset: 0,
        pointers: [],
      };

      ptr.encode(stream, null, ctx);
      expect(ctx.pointerSize).to.equal(0);
      stream.end();
      await expectation;
    });

    it("should handle local offsets", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([1]));
      });

      const ptr = new Pointer(uint8, uint8);
      const ctx: any = {
        pointerSize: 0,
        startOffset: 0,
        pointerOffset: 1,
        pointers: [],
      };

      ptr.encode(stream, 10, ctx);
      expect(ctx.pointerOffset).to.equal(2);
      expect(ctx.pointers).to.deep.equal([
        { type: uint8, val: 10, parent: ctx },
      ]);
      stream.end();
      await expectation;
    });

    it("should handle immediate offsets", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([0]));
      });

      const ptr = new Pointer(uint8, uint8, { type: "immediate" });
      const ctx: any = {
        pointerSize: 0,
        startOffset: 0,
        pointerOffset: 1,
        pointers: [],
      };

      ptr.encode(stream, 10, ctx);
      expect(ctx.pointerOffset).to.equal(2);
      expect(ctx.pointers).to.deep.equal([
        { type: uint8, val: 10, parent: ctx },
      ]);
      stream.end();
      await expectation;
    });

    it("should handle offsets relative to parent", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([2]));
      });

      const ptr = new Pointer(uint8, uint8, { type: "parent" });
      const ctx: any = {
        parent: {
          pointerSize: 0,
          startOffset: 3,
          pointerOffset: 5,
          pointers: [],
        },
      };

      ptr.encode(stream, 10, ctx);
      expect(ctx.parent.pointerOffset).to.equal(6);
      expect(ctx.parent.pointers).to.deep.equal([
        { type: uint8, val: 10, parent: ctx },
      ]);
      stream.end();
      await expectation;
    });

    it("should handle global offsets", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([5]));
      });

      const ptr = new Pointer(uint8, uint8, { type: "global" });
      const ctx: any = {
        parent: {
          parent: {
            parent: {
              pointerSize: 0,
              startOffset: 3,
              pointerOffset: 5,
              pointers: [],
            },
          },
        },
      };

      ptr.encode(stream, 10, ctx);
      expect(ctx.parent.parent.parent.pointerOffset).to.equal(6);
      expect(ctx.parent.parent.parent.pointers).to.deep.equal([
        { type: uint8, val: 10, parent: ctx },
      ]);
      stream.end();
      await expectation;
    });

    it("should support offsets relative to a property on the parent", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([6]));
      });

      const ptr = new Pointer(uint8, uint8, { relativeTo: "ptr" });
      const ctx: any = {
        pointerSize: 0,
        startOffset: 0,
        pointerOffset: 10,
        pointers: [],
        val: { ptr: 4 },
      };

      ptr.encode(stream, 10, ctx);
      expect(ctx.pointerOffset).to.equal(11);
      expect(ctx.pointers).to.deep.equal([
        { type: uint8, val: 10, parent: ctx },
      ]);
      stream.end();
      await expectation;
    });

    it("should support void pointers", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([1]));
      });

      const ptr = new Pointer(uint8, "void");
      const ctx: any = {
        pointerSize: 0,
        startOffset: 0,
        pointerOffset: 1,
        pointers: [],
      };

      ptr.encode(stream, new VoidPointer(uint8, 55), ctx);
      expect(ctx.pointerOffset).to.equal(2);
      expect(ctx.pointers).to.deep.equal([
        { type: uint8, val: 55, parent: ctx },
      ]);
      stream.end();
      await expectation;
    });

    it("should throw if not a void pointer instance", () => {
      const stream = new EncodeStream();
      const ptr = new Pointer(uint8, "void");
      const ctx: any = {
        pointerSize: 0,
        startOffset: 0,
        pointerOffset: 1,
        pointers: [],
      };

      expect(() => ptr.encode(stream, 44, ctx)).to.throw();
    });
  });
});
