import { describe, expect, it } from "vitest";
import {
  DecodeStream,
  EncodeStream,
  String as StringT,
  uint8,
} from "../src/index.js";
import { expectStream } from "./helpers.js";

describe("String", () => {
  describe("decode", () => {
    it("should decode fixed length", () => {
      const stream = new DecodeStream(Buffer.from("testing"));
      const string = new StringT(7);
      expect(string.decode(stream)).to.equal("testing");
    });

    it("should decode length from parent key", () => {
      const stream = new DecodeStream(Buffer.from("testing"));
      const string = new StringT("len");
      expect(string.decode(stream, { len: 7 })).to.equal("testing");
    });

    it("should decode length as number before string", () => {
      const stream = new DecodeStream(Buffer.from("\x07testing", "binary"));
      const string = new StringT(uint8);
      expect(string.decode(stream)).to.equal("testing");
    });

    it("should decode utf8", () => {
      const stream = new DecodeStream(Buffer.from("🍻"));
      const string = new StringT(4, "utf8");
      expect(string.decode(stream)).to.equal("🍻");
    });

    it("should decode encoding computed from function", () => {
      const stream = new DecodeStream(Buffer.from("🍻"));
      const string = new StringT(4, () => "utf8");
      expect(string.decode(stream)).to.equal("🍻");
    });

    it("should decode null-terminated string and read past terminator", () => {
      const stream = new DecodeStream(Buffer.from("🍻\x00"));
      const string = new StringT(undefined, "utf8");
      expect(string.decode(stream)).to.equal("🍻");
      expect(stream.pos).to.equal(5);
    });

    it("should decode remainder of buffer when null-byte missing", () => {
      const stream = new DecodeStream(Buffer.from("🍻"));
      const string = new StringT(undefined, "utf8");
      expect(string.decode(stream)).to.equal("🍻");
    });
  });

  describe("size", () => {
    it("should use string length", () => {
      const string = new StringT(7);
      expect(string.size("testing")).to.equal(7);
    });

    it("should use correct encoding", () => {
      const string = new StringT(10, "utf8");
      expect(string.size("🍻")).to.equal(4);
    });

    it("should use encoding from function", () => {
      const string = new StringT(10, () => "utf8");
      expect(string.size("🍻")).to.equal(4);
    });

    it("should add size of length field before string", () => {
      const string = new StringT(uint8, "utf8");
      expect(string.size("🍻")).to.equal(5);
    });

    it("should work with utf16be encoding", () => {
      const string = new StringT(10, "utf16be");
      expect(string.size("🍻")).to.equal(4);
    });

    it("should take null-byte into account", () => {
      const string = new StringT(undefined, "utf8");
      expect(string.size("🍻")).to.equal(5);
    });

    it("should use defined length if no value given", () => {
      const array = new StringT(10);
      expect(array.size()).to.equal(10);
    });
  });

  describe("encode", () => {
    it("should encode using string length", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from("testing"));
      });

      const string = new StringT(7);
      string.encode(stream, "testing");
      stream.end();
      await expectation;
    });

    it("should encode length as number before string", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from("\x07testing", "binary"));
      });

      const string = new StringT(uint8);
      string.encode(stream, "testing");
      stream.end();
      await expectation;
    });

    it("should encode length as number before utf8 string", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from("\x0ctesting 😜", "utf8"));
      });

      const string = new StringT(uint8, "utf8");
      string.encode(stream, "testing 😜");
      stream.end();
      await expectation;
    });

    it("should encode utf8", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from("🍻"));
      });

      const string = new StringT(4, "utf8");
      string.encode(stream, "🍻");
      stream.end();
      await expectation;
    });

    it("should encode encoding computed from function", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from("🍻"));
      });

      const string = new StringT(4, () => "utf8");
      string.encode(stream, "🍻");
      stream.end();
      await expectation;
    });

    it("should encode null-terminated string", async () => {
      const stream = new EncodeStream();
      const expectation = expectStream(stream, (buf) => {
        expect(buf).to.deep.equal(Buffer.from("🍻\x00"));
      });

      const string = new StringT(undefined, "utf8");
      string.encode(stream, "🍻");
      stream.end();
      await expectation;
    });
  });
});
