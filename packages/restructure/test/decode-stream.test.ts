import { Buffer } from "node:buffer";
import { describe, expect, test } from "vitest";
import { DecodeStream } from "../src/index.js";

describe("DecodeStream", () => {
  test("should read a buffer", () => {
    const buf = Buffer.from([1, 2, 3]);
    const stream = new DecodeStream(buf);
    expect(stream.readBuffer(buf.length)).to.deep.equal(Buffer.from([1, 2, 3]));
  });

  test("should readUInt16BE", () => {
    const buf = Buffer.from([0xab, 0xcd]);
    const stream = new DecodeStream(buf);
    expect(stream.readUInt16BE()).to.equal(0xabcd);
  });

  test("should readUInt16LE", () => {
    const buf = Buffer.from([0xab, 0xcd]);
    const stream = new DecodeStream(buf);
    expect(stream.readUInt16LE()).to.equal(0xcdab);
  });

  test("should readUInt24BE", () => {
    const buf = Buffer.from([0xab, 0xcd, 0xef]);
    const stream = new DecodeStream(buf);
    expect(stream.readUInt24BE()).to.equal(0xabcdef);
  });

  test("should readUInt24LE", () => {
    const buf = Buffer.from([0xab, 0xcd, 0xef]);
    const stream = new DecodeStream(buf);
    expect(stream.readUInt24LE()).to.equal(0xefcdab);
  });

  test("should readInt24BE", () => {
    const buf = Buffer.from([0xff, 0xab, 0x24]);
    const stream = new DecodeStream(buf);
    expect(stream.readInt24BE()).to.equal(-21724);
  });

  test("should readInt24LE", () => {
    const buf = Buffer.from([0x24, 0xab, 0xff]);
    const stream = new DecodeStream(buf);
    expect(stream.readInt24LE()).to.equal(-21724);
  });

  describe("readString", () => {
    test("should decode ascii by default", () => {
      const buf = Buffer.from("some text", "ascii");
      const stream = new DecodeStream(buf);
      expect(stream.readString(buf.length)).to.equal("some text");
    });

    test("should decode ascii", () => {
      const buf = Buffer.from("some text", "ascii");
      const stream = new DecodeStream(buf);
      expect(stream.readString(buf.length, "ascii")).to.equal("some text");
    });

    test("should decode utf8", () => {
      const buf = Buffer.from("unicode! 👍", "utf8");
      const stream = new DecodeStream(buf);
      expect(stream.readString(buf.length, "utf8")).to.equal("unicode! 👍");
    });

    test("should decode utf16le", () => {
      const buf = Buffer.from("unicode! 👍", "utf16le");
      const stream = new DecodeStream(buf);
      expect(stream.readString(buf.length, "utf16le")).to.equal("unicode! 👍");
    });

    test("should decode ucs2", () => {
      const buf = Buffer.from("unicode! 👍", "ucs2");
      const stream = new DecodeStream(buf);
      expect(stream.readString(buf.length, "ucs2")).to.equal("unicode! 👍");
    });

    test("should decode utf16be", () => {
      const buf = Buffer.from("unicode! 👍", "utf16le");
      for (let i = 0; i < buf.length - 1; i += 2) {
        const byte = buf[i];
        buf[i] = buf[i + 1];
        buf[i + 1] = byte;
      }
      const stream = new DecodeStream(buf);
      expect(stream.readString(buf.length, "utf16be")).to.equal("unicode! 👍");
    });

    test("should decode macroman", () => {
      const buf = Buffer.from([
        0x8a, 0x63, 0x63, 0x65, 0x6e, 0x74, 0x65, 0x64, 0x20, 0x63, 0x68, 0x87, 0x72, 0x61, 0x63,
        0x74, 0x65, 0x72, 0x73,
      ]);
      const stream = new DecodeStream(buf);
      expect(stream.readString(buf.length, "mac")).to.equal("äccented cháracters");
    });

    test("should return a buffer for unsupported encodings", () => {
      const stream = new DecodeStream(Buffer.from([1, 2, 3]));
      expect(stream.readString(3, "unsupported")).to.deep.equal(Buffer.from([1, 2, 3]));
    });
  });
});
