import { describe, expect, test } from "vitest";
import { Boolean as BooleanT, uint8 } from "../src/index.js";

describe("Boolean", () => {
  describe("decode", () => {
    test("should decode 0 as false", () => {
      const boolean = new BooleanT(uint8);
      expect(boolean.fromBuffer(new Uint8Array([0]))).to.equal(false);
    });

    test("should decode 1 as true", () => {
      const boolean = new BooleanT(uint8);
      expect(boolean.fromBuffer(new Uint8Array([1]))).to.equal(true);
    });
  });

  describe("size", () => {
    test("should return given type size", () => {
      const boolean = new BooleanT(uint8);
      expect(boolean.size()).to.equal(1);
    });
  });

  describe("encode", () => {
    test("should encode false as 0", () => {
      const boolean = new BooleanT(uint8);
      expect(boolean.toBuffer(false)).to.deep.equal(new Uint8Array([0]));
    });

    test("should encode true as 1", () => {
      const boolean = new BooleanT(uint8);
      expect(boolean.toBuffer(true)).to.deep.equal(new Uint8Array([1]));
    });
  });
});
