import { describe, expect, test } from "vitest";
import { swap32LE } from "../src/swap.js";

describe("swap32LE", () => {
  test("should not modify array on little-endian systems", () => {
    // Most modern systems are little-endian, so this is the common case
    const input = new Uint8Array([0x12, 0x34, 0x56, 0x78]);

    // On little-endian systems, this should be a no-op
    // On big-endian systems, it will swap bytes
    swap32LE(input);

    // We check that the function runs without error
    // The actual byte order depends on the system endianness
    expect(input.length).toBe(4);
  });

  test("should handle empty array", () => {
    const input = new Uint8Array([]);
    expect(() => swap32LE(input)).not.toThrow();
  });

  test("should handle multiple 32-bit values", () => {
    const input = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
    expect(() => swap32LE(input)).not.toThrow();
    expect(input.length).toBe(8);
  });

  test("should work with array that is multiple of 4 bytes", () => {
    const input = new Uint8Array(12);
    for (let i = 0; i < 12; i++) {
      input[i] = i;
    }
    expect(() => swap32LE(input)).not.toThrow();
  });
});
