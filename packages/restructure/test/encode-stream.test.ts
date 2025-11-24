import { describe, expect, it } from "vitest";
import { EncodeStream } from "../src/index.js";
import { expectStream } from "./helpers.js";

describe("EncodeStream", () => {
  it("should write a buffer", async () => {
    const stream = new EncodeStream();
    const expectation = expectStream(stream, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([1, 2, 3]));
    });

    stream.writeBuffer(Buffer.from([1, 2, 3]));
    stream.end();
    await expectation;
  });

  it("should writeUInt16BE", async () => {
    const stream = new EncodeStream();
    const expectation = expectStream(stream, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([0xab, 0xcd]));
    });

    stream.writeUInt16BE(0xabcd);
    stream.end();
    await expectation;
  });

  it("should writeUInt16LE", async () => {
    const stream = new EncodeStream();
    const expectation = expectStream(stream, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([0xab, 0xcd]));
    });

    stream.writeUInt16LE(0xcdab);
    stream.end();
    await expectation;
  });

  it("should writeUInt24BE", async () => {
    const stream = new EncodeStream();
    const expectation = expectStream(stream, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([0xab, 0xcd, 0xef]));
    });

    stream.writeUInt24BE(0xabcdef);
    stream.end();
    await expectation;
  });

  it("should writeUInt24LE", async () => {
    const stream = new EncodeStream();
    const expectation = expectStream(stream, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([0xef, 0xcd, 0xab]));
    });

    stream.writeUInt24LE(0xabcdef);
    stream.end();
    await expectation;
  });

  it("should writeInt24BE", async () => {
    const stream = new EncodeStream();
    const expectation = expectStream(stream, (buf) => {
      expect(buf).to.deep.equal(
        Buffer.from([0xff, 0xab, 0x24, 0xab, 0xcd, 0xef]),
      );
    });

    stream.writeInt24BE(-21724);
    stream.writeInt24BE(0xabcdef);
    stream.end();
    await expectation;
  });

  it("should writeInt24LE", async () => {
    const stream = new EncodeStream();
    const expectation = expectStream(stream, (buf) => {
      expect(buf).to.deep.equal(
        Buffer.from([0x24, 0xab, 0xff, 0xef, 0xcd, 0xab]),
      );
    });

    stream.writeInt24LE(-21724);
    stream.writeInt24LE(0xabcdef);
    stream.end();
    await expectation;
  });

  it("should fill", async () => {
    const stream = new EncodeStream();
    const expectation = expectStream(stream, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([10, 10, 10, 10, 10]));
    });

    stream.fill(10, 5);
    stream.end();
    await expectation;
  });

  describe("writeString", () => {
    it("should encode ascii by default", async () => {
      const stream = new EncodeStream();
      const expected = Buffer.from("some text", "ascii");
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString("some text");
      stream.end();
      await expectation;
    });

    it("should encode ascii", async () => {
      const stream = new EncodeStream();
      const expected = Buffer.from("some text", "ascii");
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString("some text", "ascii");
      stream.end();
      await expectation;
    });

    it("should encode utf8", async () => {
      const stream = new EncodeStream();
      const expected = Buffer.from("unicode! 👍", "utf8");
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString("unicode! 👍", "utf8");
      stream.end();
      await expectation;
    });

    it("should encode utf16le", async () => {
      const stream = new EncodeStream();
      const expected = Buffer.from("unicode! 👍", "utf16le");
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString("unicode! 👍", "utf16le");
      stream.end();
      await expectation;
    });

    it("should encode ucs2", async () => {
      const stream = new EncodeStream();
      const expected = Buffer.from("unicode! 👍", "ucs2");
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString("unicode! 👍", "ucs2");
      stream.end();
      await expectation;
    });

    it("should encode utf16be", async () => {
      const stream = new EncodeStream();
      const expected = Buffer.from("unicode! 👍", "utf16le");
      for (let i = 0; i < expected.length - 1; i += 2) {
        const byte = expected[i];
        expected[i] = expected[i + 1];
        expected[i + 1] = byte;
      }
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString("unicode! 👍", "utf16be");
      stream.end();
      await expectation;
    });

    it("should encode macroman", async () => {
      const stream = new EncodeStream();
      const expected = Buffer.from([
        0x8a, 0x63, 0x63, 0x65, 0x6e, 0x74, 0x65, 0x64, 0x20, 0x63, 0x68, 0x87,
        0x72, 0x61, 0x63, 0x74, 0x65, 0x72, 0x73,
      ]);
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString("äccented cháracters", "mac");
      stream.end();
      await expectation;
    });
  });
});
