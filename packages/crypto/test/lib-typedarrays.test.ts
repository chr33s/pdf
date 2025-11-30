import { beforeEach, describe, expect, test } from "vitest";
import { supportsTypedArrays, typedArrayToWordArray } from "../src/index.js";

describe("TypedArrays", () => {
  let buffer: ArrayBuffer;

  beforeEach(() => {
    buffer = new ArrayBuffer(8);

    const uint8View = new Uint8Array(buffer);
    uint8View[0] = 0x01;
    uint8View[1] = 0x23;
    uint8View[2] = 0x45;
    uint8View[3] = 0x67;
    uint8View[4] = 0x89;
    uint8View[5] = 0xab;
    uint8View[6] = 0xcd;
    uint8View[7] = 0xef;
  });

  test("should detect typed array support", () => {
    expect(supportsTypedArrays).toBe(true);
  });

  test("should convert Int8Array", () => {
    expect(typedArrayToWordArray(new Int8Array(buffer)).toString()).toBe("0123456789abcdef");
  });

  test("should convert Uint8Array", () => {
    expect(typedArrayToWordArray(new Uint8Array(buffer)).toString()).toBe("0123456789abcdef");
  });

  test("should convert Uint8ClampedArray", () => {
    expect(typedArrayToWordArray(new Uint8ClampedArray(buffer)).toString()).toBe(
      "0123456789abcdef",
    );
  });

  test("should convert Int16Array", () => {
    expect(typedArrayToWordArray(new Int16Array(buffer)).toString()).toBe("0123456789abcdef");
  });

  test("should convert Uint16Array", () => {
    expect(typedArrayToWordArray(new Uint16Array(buffer)).toString()).toBe("0123456789abcdef");
  });

  test("should convert Int32Array", () => {
    expect(typedArrayToWordArray(new Int32Array(buffer)).toString()).toBe("0123456789abcdef");
  });

  test("should convert Uint32Array", () => {
    expect(typedArrayToWordArray(new Uint32Array(buffer)).toString()).toBe("0123456789abcdef");
  });

  test("should handle partial view", () => {
    expect(typedArrayToWordArray(new Int16Array(buffer, 2, 2)).toString()).toBe("456789ab");
  });
});
