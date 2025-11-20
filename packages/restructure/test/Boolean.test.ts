import { describe, expect, it } from "vitest";
import { Boolean as BooleanT, DecodeStream, EncodeStream, uint8 } from "../src";
import { expectStream } from "./helpers";

describe("Boolean", () => {
  describe("decode", () => {
    it("should decode 0 as false", () => {
      const stream = new DecodeStream(Buffer.from([0]));
      const boolean = new BooleanT(uint8);
      expect(boolean.decode(stream)).to.equal(false);
    });

    it("should decode 1 as true", () => {
      const stream = new DecodeStream(Buffer.from([1]));
      const boolean = new BooleanT(uint8);
      expect(boolean.decode(stream)).to.equal(true);
    });
  });

  describe("size", () => {
    it("should return given type size", () => {
      const boolean = new BooleanT(uint8);
      expect(boolean.size()).to.equal(1);
    });
  });

  describe("encode", () => {
    it("should encode false as 0", async () => {
      const stream = new EncodeStream();
      const boolean = new BooleanT(uint8);
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([0]));
      });

      boolean.encode(stream, false);
      stream.end();
      await expectation;
    });

    it("should encode true as 1", async () => {
      const stream = new EncodeStream();
      const boolean = new BooleanT(uint8);
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([1]));
      });

      boolean.encode(stream, true);
      stream.end();
      await expectation;
    });
  });
});
