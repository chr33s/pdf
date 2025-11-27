import { describe, expect, test } from "vitest";
import { EncodeStream } from "../src/index.js";

describe("EncodeStream", () => {
  test("should write a buffer", () => {
    const stream = new EncodeStream(new Uint8Array(3));
    stream.writeBuffer(new Uint8Array([1, 2, 3]));
    expect(stream.buffer).to.deep.equal(new Uint8Array([1, 2, 3]));
  });

  test("should writeUInt16BE", () => {
    const stream = new EncodeStream(new Uint8Array(2));
    stream.writeUInt16BE(0xabcd);
    expect(stream.buffer).to.deep.equal(new Uint8Array([0xab, 0xcd]));
  });

  test("should writeUInt16LE", () => {
    const stream = new EncodeStream(new Uint8Array(2));
    stream.writeUInt16LE(0xcdab);
    expect(stream.buffer).to.deep.equal(new Uint8Array([0xab, 0xcd]));
  });

  test("should writeUInt24BE", () => {
    const stream = new EncodeStream(new Uint8Array(3));
    stream.writeUInt24BE(0xabcdef);
    expect(stream.buffer).to.deep.equal(new Uint8Array([0xab, 0xcd, 0xef]));
  });

  test("should writeUInt24LE", () => {
    const stream = new EncodeStream(new Uint8Array(3));
    stream.writeUInt24LE(0xabcdef);
    expect(stream.buffer).to.deep.equal(new Uint8Array([0xef, 0xcd, 0xab]));
  });

  test("should writeInt24BE", () => {
    const stream = new EncodeStream(new Uint8Array(6));
    stream.writeInt24BE(-21724);
    stream.writeInt24BE(0xabcdef);
    expect(stream.buffer).to.deep.equal(new Uint8Array([0xff, 0xab, 0x24, 0xab, 0xcd, 0xef]));
  });

  test("should writeInt24LE", () => {
    const stream = new EncodeStream(new Uint8Array(6));
    stream.writeInt24LE(-21724);
    stream.writeInt24LE(0xabcdef);
    expect(stream.buffer).to.deep.equal(new Uint8Array([0x24, 0xab, 0xff, 0xef, 0xcd, 0xab]));
  });

  test("should fill", () => {
    const stream = new EncodeStream(new Uint8Array(5));
    stream.fill(10, 5);
    expect(stream.buffer).to.deep.equal(new Uint8Array([10, 10, 10, 10, 10]));
  });

  describe("writeString", () => {
    test("should encode ascii by default", () => {
      const expected = Buffer.from("some text", "ascii");
      const stream = new EncodeStream(new Uint8Array(expected.length));
      stream.writeString("some text");
      expect(stream.buffer).to.deep.equal(new Uint8Array(expected));
    });

    test("should encode ascii", () => {
      const expected = Buffer.from("some text", "ascii");
      const stream = new EncodeStream(new Uint8Array(expected.length));
      stream.writeString("some text", "ascii");
      expect(stream.buffer).to.deep.equal(new Uint8Array(expected));
    });

    test("should encode utf8", () => {
      const expected = Buffer.from("unicode! 👍", "utf8");
      const stream = new EncodeStream(new Uint8Array(expected.length));
      stream.writeString("unicode! 👍", "utf8");
      expect(stream.buffer).to.deep.equal(new Uint8Array(expected));
    });

    test("should encode utf16le", () => {
      const expected = Buffer.from("unicode! 👍", "utf16le");
      const stream = new EncodeStream(new Uint8Array(expected.length));
      stream.writeString("unicode! 👍", "utf16le");
      expect(stream.buffer).to.deep.equal(new Uint8Array(expected));
    });

    test("should encode ucs2", () => {
      const expected = Buffer.from("unicode! 👍", "ucs2");
      const stream = new EncodeStream(new Uint8Array(expected.length));
      stream.writeString("unicode! 👍", "ucs2");
      expect(stream.buffer).to.deep.equal(new Uint8Array(expected));
    });

    test("should encode utf16be", () => {
      const expected = Buffer.from("unicode! 👍", "utf16le");
      for (let i = 0; i < expected.length - 1; i += 2) {
        const byte = expected[i];
        expected[i] = expected[i + 1];
        expected[i + 1] = byte;
      }
      const stream = new EncodeStream(new Uint8Array(expected.length));
      stream.writeString("unicode! 👍", "utf16be");
      expect(stream.buffer).to.deep.equal(new Uint8Array(expected));
    });

    test("should throw for unsupported encoding", () => {
      const stream = new EncodeStream(new Uint8Array(19));
      expect(() => stream.writeString("äccented cháracters", "mac")).to.throw(
        "Unsupported encoding: mac",
      );
    });
  });
});
