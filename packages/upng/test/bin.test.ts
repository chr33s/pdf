import { describe, expect, test } from "vitest";
import { Bin } from "../src/bin.js";

describe("nextZero", () => {
  test("returns index of first zero starting at p", () => {
    const data = new Uint8Array([1, 2, 3, 0, 4]);
    expect(Bin.nextZero(data, 0)).toBe(3);
  });

  test("returns p when it already points to zero", () => {
    const data = new Uint8Array([1, 2, 0, 4]);
    expect(Bin.nextZero(data, 2)).toBe(2);
  });
});

describe("readUshort / writeUshort", () => {
  test("reads a big-endian unsigned short written by writeUshort", () => {
    const buff = new Uint8Array(4);
    const value = 0x1234; // 4660
    Bin.writeUshort(buff, 1, value);
    expect(buff[1]).toBe(0x12);
    expect(buff[2]).toBe(0x34);

    const readValue = Bin.readUshort(buff, 1);
    expect(readValue).toBe(value);
  });

  test("handles minimum and maximum ushort values", () => {
    const buff = new Uint8Array(4);

    Bin.writeUshort(buff, 0, 0);
    expect(Bin.readUshort(buff, 0)).toBe(0);

    Bin.writeUshort(buff, 0, 0xffff);
    expect(Bin.readUshort(buff, 0)).toBe(0xffff);
  });
});

describe("readUint / writeUint", () => {
  test("reads a big-endian unsigned int written by writeUint", () => {
    const buff = new Uint8Array(8);
    const value = 0x12345678; // 305419896
    Bin.writeUint(buff, 2, value);

    expect(buff[2]).toBe(0x12);
    expect(buff[3]).toBe(0x34);
    expect(buff[4]).toBe(0x56);
    expect(buff[5]).toBe(0x78);

    const readValue = Bin.readUint(buff, 2);
    expect(readValue).toBe(value);
  });

  test("handles minimum and maximum 32-bit unsigned values", () => {
    const buff = new Uint8Array(4);

    Bin.writeUint(buff, 0, 0);
    expect(Bin.readUint(buff, 0)).toBe(0);

    const max = 0xffffffff; // 4294967295
    Bin.writeUint(buff, 0, max);
    expect(Bin.readUint(buff, 0)).toBe(max);
  });
});

describe("readASCII / writeASCII", () => {
  test("writes and reads ASCII strings correctly", () => {
    const buff = new Uint8Array(10);
    const s = "Hello";
    Bin.writeASCII(buff, 2, s);

    // Raw bytes
    expect(Array.from(buff.slice(2, 7))).toEqual([
      "H".charCodeAt(0),
      "e".charCodeAt(0),
      "l".charCodeAt(0),
      "l".charCodeAt(0),
      "o".charCodeAt(0),
    ]);

    const read = Bin.readASCII(buff, 2, s.length);
    expect(read).toBe(s);
  });

  test("can write shorter strings without touching earlier bytes", () => {
    const buff = new Uint8Array(5).fill(0xff);
    Bin.writeASCII(buff, 1, "A");
    expect(buff[0]).toBe(0xff);
    expect(buff[1]).toBe("A".charCodeAt(0));
  });
});

describe("readBytes", () => {
  test("returns a JS array slice of the specified bytes", () => {
    const buff = new Uint8Array([10, 20, 30, 40, 50]);
    const arr = Bin.readBytes(buff, 1, 3);
    expect(arr).toEqual([20, 30, 40]);
  });

  test("works with length 0", () => {
    const buff = new Uint8Array([1, 2, 3]);
    const arr = Bin.readBytes(buff, 1, 0);
    expect(arr).toEqual([]);
  });
});

describe("pad", () => {
  test("adds a leading zero for single-character strings", () => {
    expect(Bin.pad("a")).toBe("0a");
    expect(Bin.pad("1")).toBe("01");
  });

  test("returns the original string if length >= 2", () => {
    expect(Bin.pad("10")).toBe("10");
    expect(Bin.pad("abc")).toBe("abc");
  });
});

describe("readUTF8", () => {
  test("decodes valid UTF-8 sequences", () => {
    // "hé" in UTF-8
    const encoder = new TextEncoder();
    const s = "hé";
    const bytes = encoder.encode(s); // Uint8Array

    const buff = new Uint8Array(10);
    buff.set(bytes, 2);

    const decoded = Bin.readUTF8(buff, 2, bytes.length);
    expect(decoded).toBe(s);
  });

  test("falls back to ASCII when decodeURIComponent throws", () => {
    // Create bytes that produce an invalid percent-escape sequence
    // '%' followed by non-hex characters
    const _buff = new Uint8Array([37, 71, 71]); // '%GG'
    // readUTF8 will create string "%25%47%47", which is valid,
    // so we instead force a bad sequence by hand:
    // We'll directly test the catch path by constructing an impossible pattern:
    //
    // To get into catch, we need decodeURIComponent to throw.
    // One way is to craft an incomplete escape at end: e.g. "%E2%82"
    const invalid = new Uint8Array([
      0xe2, // 226
      0x82, // 130
    ]);
    const bigBuff = new Uint8Array(10);
    bigBuff.set(invalid, 0);

    // Monkey-patch pad+readASCII behavior is not necessary,
    // instead we rely on decodeURIComponent("%e2%82") throwing.
    const result = Bin.readUTF8(bigBuff, 0, invalid.length);

    // Fallback is ASCII for same bytes
    const ascii = Bin.readASCII(bigBuff, 0, invalid.length);
    expect(result).toBe(ascii);
  });

  test("matches ASCII for plain ASCII strings", () => {
    const text = "Hello";
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);

    const buff = new Uint8Array(10);
    buff.set(bytes, 1);

    const utf8 = Bin.readUTF8(buff, 1, bytes.length);
    const ascii = Bin.readASCII(buff, 1, bytes.length);

    expect(utf8).toBe(text);
    expect(utf8).toBe(ascii);
  });
});
