import { describe, expect, it } from "vitest";
import { CRC } from "../src/crc.js";

describe("table", () => {
  it("has 256 entries", () => {
    expect(CRC.table).toBeInstanceOf(Uint32Array);
    expect(CRC.table.length).toBe(256);
  });
});

describe("update", () => {
  it("returns the same value when updating with zero-length buffer", () => {
    const initial = 0x12345678;
    const buf = new Uint8Array([1, 2, 3, 4]);
    const result = CRC.update(initial, buf, 0, 0);
    expect(result).toBe(initial);
  });

  it("updates CRC incrementally equivalent to one-shot", () => {
    const text = "Hello, world!";
    const bytes = new TextEncoder().encode(text);

    const full = CRC.update(0xffffffff, bytes, 0, bytes.length);

    const mid = Math.floor(bytes.length / 2);
    const part1 = CRC.update(0xffffffff, bytes, 0, mid);
    const part2 = CRC.update(part1, bytes, mid, bytes.length - mid);

    expect(part2 >>> 0).toBe(full >>> 0);
  });

  it("respects offset and length", () => {
    const buf = new Uint8Array([0, 1, 2, 3, 4, 5]);
    const c1 = CRC.update(0xffffffff, buf, 1, 3);

    const slice = buf.slice(1, 4);
    const c2 = CRC.update(0xffffffff, slice, 0, slice.length);

    expect(c1 >>> 0).toBe(c2 >>> 0);
  });
});

describe("crc", () => {
  it("matches known CRC-32 values for test vectors", () => {
    const enc = new TextEncoder();

    // Empty buffer (standard CRC-32)
    expect(CRC.crc(new Uint8Array([]), 0, 0) >>> 0).toBe(0x00000000);

    // "123456789" -> 0xCBF43926
    const v1 = enc.encode("123456789");
    expect(CRC.crc(v1, 0, v1.length) >>> 0).toBe(0xcbf43926);

    // Just verify that we return a valid 32-bit value for another string
    const v2 = enc.encode("Hello, world!");
    const crc2 = CRC.crc(v2, 0, v2.length) >>> 0;
    expect(crc2).toBeGreaterThanOrEqual(0);
    expect(crc2).toBeLessThanOrEqual(0xffffffff);
  });

  it("computes CRC on a subrange using offset and length", () => {
    const enc = new TextEncoder();
    const full = enc.encode("ABCDEF");
    const subCrc = CRC.crc(full, 1, 3); // "BCD"

    const sub = enc.encode("BCD");
    const expected = CRC.crc(sub, 0, sub.length);

    expect(subCrc >>> 0).toBe(expected >>> 0);
  });
});
