import { describe, expect, test } from "vitest";
import {
  decodeUtf8,
  encodedLength,
  matchesTag,
  toUint8Array,
  type BinaryLike,
} from "../src/binary.js";

describe("toUint8Array", () => {
  test("returns same Uint8Array when passed a Uint8Array", () => {
    const original = new Uint8Array([1, 2, 3, 4]);
    const result = toUint8Array(original);
    expect(result).toBe(original);
  });

  test("converts ArrayBuffer to Uint8Array", () => {
    const buffer = new ArrayBuffer(4);
    new Uint8Array(buffer).set([10, 20, 30, 40]);
    const result = toUint8Array(buffer);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([10, 20, 30, 40]);
  });

  test("converts DataView to Uint8Array", () => {
    const buffer = new ArrayBuffer(4);
    new Uint8Array(buffer).set([5, 6, 7, 8]);
    const dataView = new DataView(buffer);
    const result = toUint8Array(dataView);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([5, 6, 7, 8]);
  });

  test("converts partial DataView to Uint8Array with correct offset and length", () => {
    const buffer = new ArrayBuffer(8);
    new Uint8Array(buffer).set([1, 2, 3, 4, 5, 6, 7, 8]);
    const dataView = new DataView(buffer, 2, 4);
    const result = toUint8Array(dataView);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([3, 4, 5, 6]);
  });

  test("converts Int8Array to Uint8Array", () => {
    const int8 = new Int8Array([1, -1, 127, -128]);
    const result = toUint8Array(int8);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  test("throws TypeError for unsupported types", () => {
    expect(() => toUint8Array("string" as unknown as BinaryLike)).toThrow(TypeError);
    expect(() => toUint8Array(123 as unknown as BinaryLike)).toThrow(TypeError);
    expect(() => toUint8Array(null as unknown as BinaryLike)).toThrow(TypeError);
  });
});

describe("matchesTag", () => {
  test("returns true when buffer matches tag at offset 0", () => {
    const buffer = new Uint8Array([0x74, 0x74, 0x63, 0x66]); // "ttcf"
    expect(matchesTag(buffer, "ttcf")).toBe(true);
  });

  test("returns true when buffer matches tag at specified offset", () => {
    const buffer = new Uint8Array([0x00, 0x00, 0x74, 0x74, 0x63, 0x66]); // "\0\0ttcf"
    expect(matchesTag(buffer, "ttcf", 2)).toBe(true);
  });

  test("returns false when buffer does not match tag", () => {
    const buffer = new Uint8Array([0x77, 0x4f, 0x46, 0x46]); // "wOFF"
    expect(matchesTag(buffer, "ttcf")).toBe(false);
  });

  test("returns false when buffer is too short", () => {
    const buffer = new Uint8Array([0x74, 0x74]); // "tt"
    expect(matchesTag(buffer, "ttcf")).toBe(false);
  });

  test("returns false when remaining buffer after offset is too short", () => {
    const buffer = new Uint8Array([0x00, 0x74, 0x74, 0x63]); // "\0ttc"
    expect(matchesTag(buffer, "ttcf", 1)).toBe(false);
  });

  test("returns true for empty tag", () => {
    const buffer = new Uint8Array([0x74, 0x74, 0x63, 0x66]);
    expect(matchesTag(buffer, "")).toBe(true);
  });

  test("matches single character tag", () => {
    const buffer = new Uint8Array([0x41, 0x42, 0x43]); // "ABC"
    expect(matchesTag(buffer, "A")).toBe(true);
    expect(matchesTag(buffer, "B", 1)).toBe(true);
  });

  test("matches common font format tags", () => {
    expect(matchesTag(new Uint8Array([0x4f, 0x54, 0x54, 0x4f]), "OTTO")).toBe(true);
    expect(matchesTag(new Uint8Array([0x77, 0x4f, 0x46, 0x46]), "wOFF")).toBe(true);
    expect(matchesTag(new Uint8Array([0x77, 0x4f, 0x46, 0x32]), "wOF2")).toBe(true);
  });
});

describe("decodeUtf8", () => {
  test("decodes ASCII bytes to string", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    expect(decodeUtf8(bytes)).toBe("Hello");
  });

  test("decodes empty array to empty string", () => {
    const bytes = new Uint8Array([]);
    expect(decodeUtf8(bytes)).toBe("");
  });

  test("decodes multi-byte UTF-8 characters", () => {
    // "日本" in UTF-8: E6 97 A5 E6 9C AC
    const bytes = new Uint8Array([0xe6, 0x97, 0xa5, 0xe6, 0x9c, 0xac]);
    expect(decodeUtf8(bytes)).toBe("日本");
  });

  test("decodes emoji (4-byte UTF-8)", () => {
    // "😀" in UTF-8: F0 9F 98 80
    const bytes = new Uint8Array([0xf0, 0x9f, 0x98, 0x80]);
    expect(decodeUtf8(bytes)).toBe("😀");
  });

  test("decodes mixed ASCII and multi-byte characters", () => {
    // "Café" in UTF-8: 43 61 66 C3 A9
    const bytes = new Uint8Array([0x43, 0x61, 0x66, 0xc3, 0xa9]);
    expect(decodeUtf8(bytes)).toBe("Café");
  });
});

describe("encodedLength", () => {
  test("returns correct length for utf16le encoding", () => {
    expect(encodedLength("Hello", "utf16le")).toBe(10);
    expect(encodedLength("", "utf16le")).toBe(0);
    expect(encodedLength("A", "utf16le")).toBe(2);
  });

  test("returns correct length for ascii encoding", () => {
    expect(encodedLength("Hello", "ascii")).toBe(5);
    expect(encodedLength("", "ascii")).toBe(0);
    expect(encodedLength("A", "ascii")).toBe(1);
  });

  test("utf16le counts characters not bytes for surrogate pairs", () => {
    // Note: This tests current behavior - emoji like 😀 is counted as 2 JS chars
    const emoji = "😀";
    expect(emoji.length).toBe(2); // JS string length
    expect(encodedLength(emoji, "utf16le")).toBe(4); // 2 * 2
  });
});
