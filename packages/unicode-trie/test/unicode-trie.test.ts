import { describe, expect, test } from "vitest";

import UnicodeTrieBuilder from "../src/builder.js";
import UnicodeTrie from "../src/index.js";

describe("unicode trie", () => {
  test("set", () => {
    const trie = new UnicodeTrieBuilder(10, 666);
    trie.set(0x4567, 99);
    expect(trie.get(0x4566)).toBe(10);
    expect(trie.get(0x4567)).toBe(99);
    expect(trie.get(-1)).toBe(666);
    expect(trie.get(0x110000)).toBe(666);
  });

  test("set -> compacted trie", () => {
    const builder = new UnicodeTrieBuilder(10, 666);
    builder.set(0x4567, 99);

    const trie = builder.freeze();
    expect(trie.get(0x4566)).toBe(10);
    expect(trie.get(0x4567)).toBe(99);
    expect(trie.get(-1)).toBe(666);
    expect(trie.get(0x110000)).toBe(666);
  });

  test("setRange", () => {
    const trie = new UnicodeTrieBuilder(10, 666);
    trie.setRange(13, 6666, 7788, false);
    trie.setRange(6000, 7000, 9900, true);

    expect(trie.get(12)).toBe(10);
    expect(trie.get(13)).toBe(7788);
    expect(trie.get(5999)).toBe(7788);
    expect(trie.get(6000)).toBe(9900);
    expect(trie.get(7000)).toBe(9900);
    expect(trie.get(7001)).toBe(10);
    expect(trie.get(0x110000)).toBe(666);
  });

  test("setRange -> compacted trie", () => {
    const builder = new UnicodeTrieBuilder(10, 666);
    builder.setRange(13, 6666, 7788, false);
    builder.setRange(6000, 7000, 9900, true);

    const trie = builder.freeze();
    expect(trie.get(12)).toBe(10);
    expect(trie.get(13)).toBe(7788);
    expect(trie.get(5999)).toBe(7788);
    expect(trie.get(6000)).toBe(9900);
    expect(trie.get(7000)).toBe(9900);
    expect(trie.get(7001)).toBe(10);
    expect(trie.get(0x110000)).toBe(666);
  });

  test("toBuffer written in little-endian", () => {
    const builder = new UnicodeTrieBuilder();
    builder.set(0x4567, 99);

    const buf = builder.toBuffer();
    const bufferExpected = Buffer.from([
      0, 72, 0, 0, 0, 0, 0, 0, 128, 36, 0, 0, 123, 123, 206, 144, 235, 128, 2, 143, 67, 96, 225,
      171, 23, 55, 54, 38, 231, 47, 44, 127, 233, 90, 109, 194, 92, 246, 126, 197, 131, 223, 31, 56,
      102, 78, 154, 20, 108, 117, 88, 244, 93, 192, 190, 218, 229, 156, 12, 107, 86, 235, 125, 96,
      102, 0, 129, 15, 239, 109, 219, 204, 58, 151, 92, 52, 126, 152, 198, 14, 0,
    ]);
    expect(buf.toString("hex")).toBe(bufferExpected.toString("hex"));
  });

  test("should work with compressed serialization format", () => {
    const builder = new UnicodeTrieBuilder(10, 666);
    builder.setRange(13, 6666, 7788, false);
    builder.setRange(6000, 7000, 9900, true);

    const buf = builder.toBuffer();
    const trie = new UnicodeTrie(buf);
    expect(trie.get(12)).toBe(10);
    expect(trie.get(13)).toBe(7788);
    expect(trie.get(5999)).toBe(7788);
    expect(trie.get(6000)).toBe(9900);
    expect(trie.get(7000)).toBe(9900);
    expect(trie.get(7001)).toBe(10);
    expect(trie.get(0x110000)).toBe(666);
  });

  const rangeTests = [
    {
      ranges: [
        [0, 0, 0, 0],
        [0, 0x40, 0, 0],
        [0x40, 0xe7, 0x1234, 0],
        [0xe7, 0x3400, 0, 0],
        [0x3400, 0x9fa6, 0x6162, 0],
        [0x9fa6, 0xda9e, 0x3132, 0],
        [0xdada, 0xeeee, 0x87ff, 0],
        [0xeeee, 0x11111, 1, 0],
        [0x11111, 0x44444, 0x6162, 0],
        [0x44444, 0x60003, 0, 0],
        [0xf0003, 0xf0004, 0xf, 0],
        [0xf0004, 0xf0006, 0x10, 0],
        [0xf0006, 0xf0007, 0x11, 0],
        [0xf0007, 0xf0040, 0x12, 0],
        [0xf0040, 0x110000, 0, 0],
      ],
      check: [
        [0, 0],
        [0x40, 0],
        [0xe7, 0x1234],
        [0x3400, 0],
        [0x9fa6, 0x6162],
        [0xda9e, 0x3132],
        [0xdada, 0],
        [0xeeee, 0x87ff],
        [0x11111, 1],
        [0x44444, 0x6162],
        [0xf0003, 0],
        [0xf0004, 0xf],
        [0xf0006, 0x10],
        [0xf0007, 0x11],
        [0xf0040, 0x12],
        [0x110000, 0],
      ],
    },
    {
      ranges: [
        [0, 0, 0, 0],
        [0x21, 0x7f, 0x5555, 1],
        [0x2f800, 0x2fedc, 0x7a, 1],
        [0x72, 0xdd, 3, 1],
        [0xdd, 0xde, 4, 0],
        [0x201, 0x240, 6, 1],
        [0x241, 0x280, 6, 1],
        [0x281, 0x2c0, 6, 1],
        [0x2f987, 0x2fa98, 5, 1],
        [0x2f777, 0x2f883, 0, 1],
        [0x2f900, 0x2ffaa, 1, 0],
        [0x2ffaa, 0x2ffab, 2, 1],
        [0x2ffbb, 0x2ffc0, 7, 1],
      ],
      check: [
        [0, 0],
        [0x21, 0],
        [0x72, 0x5555],
        [0xdd, 3],
        [0xde, 4],
        [0x201, 0],
        [0x240, 6],
        [0x241, 0],
        [0x280, 6],
        [0x281, 0],
        [0x2c0, 6],
        [0x2f883, 0],
        [0x2f987, 0x7a],
        [0x2fa98, 5],
        [0x2fedc, 0x7a],
        [0x2ffaa, 1],
        [0x2ffab, 2],
        [0x2ffbb, 0],
        [0x2ffc0, 7],
        [0x110000, 0],
      ],
    },
    {
      ranges: [
        [0, 0, 9, 0],
        [0x31, 0xa4, 1, 0],
        [0x3400, 0x6789, 2, 0],
        [0x8000, 0x89ab, 9, 1],
        [0x9000, 0xa000, 4, 1],
        [0xabcd, 0xbcde, 3, 1],
        [0x55555, 0x110000, 6, 1],
        [0xcccc, 0x55555, 6, 1],
      ],
      check: [
        [0, 9],
        [0x31, 9],
        [0xa4, 1],
        [0x3400, 9],
        [0x6789, 2],
        [0x9000, 9],
        [0xa000, 4],
        [0xabcd, 9],
        [0xbcde, 3],
        [0xcccc, 9],
        [0x110000, 6],
      ],
    },
    {
      ranges: [[0, 0, 3, 0]],
      check: [
        [0, 3],
        [0x110000, 3],
      ],
    },
    {
      ranges: [
        [0, 0, 3, 0],
        [0, 0x110000, 5, 1],
      ],
      check: [
        [0, 3],
        [0x110000, 5],
      ],
    },
  ] as const;

  type TrieLike = { get: (codePoint: number) => number };

  const findMismatch = (trie: TrieLike, checks: readonly (readonly [number, number])[]) => {
    let start = 0;
    for (const [end, expected] of checks) {
      for (let codePoint = start; codePoint < end; codePoint++) {
        const actual = trie.get(codePoint);
        if (actual !== expected) {
          return { codePoint, expected, actual } as const;
        }
      }
      start = end;
    }
    return null;
  };

  test("should pass range tests", () => {
    for (const rangeTest of rangeTests) {
      let initialValue = 0;
      let errorValue = 0x0bad;
      let index = 0;

      if (rangeTest.ranges[index][1] < 0) {
        errorValue = rangeTest.ranges[index][2];
        index++;
      }

      initialValue = rangeTest.ranges[index++][2];
      const builder = new UnicodeTrieBuilder(initialValue, errorValue);

      for (const range of rangeTest.ranges.slice(index)) {
        builder.setRange(range[0], range[1] - 1, range[2], range[3] !== 0);
      }

      const frozen = builder.freeze();

      const builderMismatch = findMismatch(builder, rangeTest.check);
      const builderMessage = builderMismatch
        ? `builder mismatch at U+${builderMismatch.codePoint.toString(16)}: expected ${builderMismatch.expected}, got ${builderMismatch.actual}`
        : undefined;
      expect(builderMismatch, builderMessage).toBeNull();

      const frozenMismatch = findMismatch(frozen, rangeTest.check);
      const frozenMessage = frozenMismatch
        ? `frozen mismatch at U+${frozenMismatch.codePoint.toString(16)}: expected ${frozenMismatch.expected}, got ${frozenMismatch.actual}`
        : undefined;
      expect(frozenMismatch, frozenMessage).toBeNull();
    }
  });
});
