import pako from "pako";
import { describe, expect, test } from "vitest";
import { Inflator } from "../src/inflator.js";

describe("Inflator tables initialization", () => {
  const D = Inflator.D;

  test("creates all expected table types with correct lengths", () => {
    expect(D.m).toBeInstanceOf(Uint16Array);
    expect(D.v).toBeInstanceOf(Uint16Array);
    expect(D.B).toBeInstanceOf(Uint16Array);
    expect(D.h).toBeInstanceOf(Uint32Array);
    expect(D.g).toBeInstanceOf(Uint16Array);
    expect(D.A).toBeInstanceOf(Uint16Array);
    expect(D.k).toBeInstanceOf(Uint16Array);
    expect(D.n).toBeInstanceOf(Uint16Array);
    expect(D.C).toBeInstanceOf(Uint16Array);
    expect(D.i).toBeInstanceOf(Uint16Array);
    expect(D.r).toBeInstanceOf(Uint32Array);
    expect(D.f).toBeInstanceOf(Uint32Array);
    expect(D.l).toBeInstanceOf(Uint32Array);
    expect(D.u).toBeInstanceOf(Uint32Array);
    expect(D.q).toBeInstanceOf(Uint16Array);
    expect(D.j).toBeInstanceOf(Uint16Array);

    expect(D.m.length).toBe(16);
    expect(D.v.length).toBe(16);
    expect(D.B.length).toBe(32);
    expect(D.h.length).toBe(32);
    expect(D.g.length).toBe(512);
    expect(D.A.length).toBe(32);
    expect(D.k.length).toBe(32768);
    expect(D.n.length).toBe(32768);
    expect(D.C.length).toBe(512);
    expect(D.i.length).toBe(1 << 15);
    expect(D.r.length).toBe(286);
    expect(D.f.length).toBe(30);
    expect(D.l.length).toBe(19);
    expect(D.u.length).toBe(15000);
    expect(D.q.length).toBe(1 << 16);
    expect(D.j.length).toBe(1 << 15);
  });

  test("precomputes correct fixed Huffman length and distance tables for some entries", () => {
    // For fixed Huffman, the first 144 literal/length symbols use 8-bit codes.
    // `tables.s` is the canonical (code,length) pair array backing `g`.
    // Check some sample lengths.
    const s = D.s;
    // s is [code0, len0, code1, len1, ...]
    const len0 = s[1];
    const len143 = s[(143 << 1) + 1];
    const len144 = s[(144 << 1) + 1];

    expect(len0).toBe(8);
    expect(len143).toBe(8);
    expect(len144).toBe(9); // start of the 9-bit block

    // Distance codes for fixed Huffman use 5 bits each.
    const t = D.t;
    const distLen0 = t[1];
    const distLen29 = t[(29 << 1) + 1];
    expect(distLen0).toBe(5);
    expect(distLen29).toBe(5);
  });

  test("bit-reversal table i is self-consistent for a few sample entries", () => {
    const i = D.i;
    // For some simple patterns, reversing twice should give the original index
    const samples = [0, 1, 0b101010101010101, 0b111000000000000, 0x7fff];
    for (const v of samples) {
      const rev = i[v];
      const rev2 = i[rev];
      expect(rev2).toBe(v);
    }
  });
});

describe("Inflator helpers", () => {
  test("H expands buffer capacity when needed and preserves content", () => {
    const original = new Uint8Array([1, 2, 3, 4]);
    const same = Inflator.H(original, 4);
    expect(same).toBe(original);

    const expanded = Inflator.H(original, 10);
    expect(expanded).not.toBe(original);
    expect(expanded.length).toBeGreaterThanOrEqual(10);
    expect(Array.from(expanded.slice(0, 4))).toEqual([1, 2, 3, 4]);
  });

  test("C_inner assigns canonical codes consistently with straightforward implementation", () => {
    // Build a small length array: 4 symbols with lengths [2,3,3,1]
    const lengths = [2, 3, 3, 1];
    // o: [code0,len0,code1,len1,...] initially codes are 0
    const o: number[] = [];
    for (const len of lengths) {
      o.push(0, len);
    }

    // Run C_inner with max bits = 3
    Inflator.C_inner(o, 3);

    // Our own simple canonical-code computation for comparison
    const maxBits = 3;
    const blCount: number[] = Array.from({ length: maxBits + 1 }).fill(0) as number[];
    lengths.forEach((l) => {
      if (l > 0) blCount[l]++;
    });

    const nextCode: number[] = Array.from({ length: maxBits + 1 }).fill(0) as number[];
    let code = 0;
    for (let bits = 1; bits <= maxBits; bits++) {
      code = (code + blCount[bits - 1]) << 1;
      nextCode[bits] = code;
    }

    const expectedCodes: number[] = [];
    for (const len of lengths) {
      if (len === 0) {
        expectedCodes.push(0);
      } else {
        const c = nextCode[len];
        expectedCodes.push(c);
        nextCode[len]++;
      }
    }

    const actualCodes = [];
    for (let idx = 0; idx < o.length; idx += 2) {
      actualCodes.push(o[idx]);
    }

    expect(actualCodes).toEqual(expectedCodes);
  });

  test("d maps lengths into (code,length) pairs and returns max length", () => {
    const lengths = [3, 0, 5, 1]; // I = 4 symbols
    const target: number[] = Array.from({ length: 8 }).fill(0) as number[]; // length = 8 => 4 pairs
    const maxBits = Inflator.d(lengths, 0, lengths.length, target);

    // target: [code0,len0, code1,len1, ...] but C_inner hasn't run yet,
    // so codes should all be 0 and lengths should match.
    expect(target).toEqual([0, 3, 0, 0, 0, 5, 0, 1]);
    expect(maxBits).toBe(5);
  });
});

describe("Inflator.inflateRaw", () => {
  test("returns empty output for special case header 0x03 0x00", () => {
    const input = new Uint8Array([0x03, 0x00]); // triggers early-return branch
    const result = Inflator.inflateRaw(input);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });

  test("inflates a stored (uncompressed) block correctly", () => {
    // Deflate "ABC" as a single stored block:
    // BFINAL=1, BTYPE=00
    // LEN=3, NLEN=~3 (0xFFFC)
    // raw data: 0x41,0x42,0x43
    //
    // Bits: 1 (final) + 00 (stored) => 001 => 0x01 at low bits
    // We'll assemble minimal correct stored block bytes:
    const stored = new Uint8Array([
      0x01, // BFINAL=1,BTYPE=00,and padding
      0x03,
      0x00, // LEN = 3
      0xfc,
      0xff, // NLEN = ~3
      0x41,
      0x42,
      0x43, // "ABC"
    ]);

    const out = Inflator.inflateRaw(stored);
    expect(new TextDecoder().decode(out)).toBe("ABC");
  });

  test("inflates a fixed Huffman block identically to pako", () => {
    const text = "Hello, world! Hello, world!";
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // pako.deflateRaw uses raw deflate (no zlib wrapper)
    const compressed = pako.deflateRaw(data);
    const ours = Inflator.inflateRaw(compressed);

    expect(new TextDecoder().decode(ours)).toBe(text);
  });

  test("inflates a dynamic Huffman block identically to pako", () => {
    const text = "Dynamic Huffman blocks are used for better compression on varied data.";
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Force pako to use dynamic Huffman by default (it usually does anyway)
    const compressed = pako.deflateRaw(data); // contains dynamic blocks
    const ours = Inflator.inflateRaw(compressed);

    expect(new TextDecoder().decode(ours)).toBe(text);
  });

  test("supports inflating into a preallocated output buffer", () => {
    const text = "Preallocated output buffer test.";
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const compressed = pako.deflateRaw(data);

    // Preallocate a buffer with exactly the required size
    const out = new Uint8Array(text.length);
    const result = Inflator.inflateRaw(compressed, out);

    // Using supplied buffer should either reuse or slice it exactly to size
    expect(result.length).toBe(text.length);
    expect(new TextDecoder().decode(result)).toBe(text);
  });

  test("grows output buffer as needed when not provided", () => {
    const text = "X".repeat(100000); // big to force resizing via H()
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const compressed = pako.deflateRaw(data);

    const result = Inflator.inflateRaw(compressed);
    expect(result.length).toBe(text.length);
    expect(new TextDecoder().decode(result)).toBe(text);
  });
});
