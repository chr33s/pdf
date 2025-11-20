import { describe, expect, it } from "vitest";
import { Bitfield, DecodeStream, EncodeStream, uint8 } from "../src";
import { expectStream } from "./helpers";

describe("Bitfield", () => {
  const bitfield = new Bitfield(uint8, [
    "Jack",
    "Kack",
    "Lack",
    "Mack",
    "Nack",
    "Oack",
    "Pack",
    "Quack",
  ]);
  const JACK = 1 << 0;
  const MACK = 1 << 3;
  const NACK = 1 << 4;
  const PACK = 1 << 6;
  const QUACK = 1 << 7;

  it("should have the right size", () => {
    expect(bitfield.size()).to.equal(1);
  });

  it("should decode", () => {
    const stream = new DecodeStream(
      Buffer.from([JACK | MACK | PACK | NACK | QUACK]),
    );
    expect(bitfield.decode(stream)).to.deep.equal({
      Jack: true,
      Kack: false,
      Lack: false,
      Mack: true,
      Nack: true,
      Oack: false,
      Pack: true,
      Quack: true,
    });
  });

  it("should encode", async () => {
    const stream = new EncodeStream();
    const expectation = expectStream(stream, (buf) => {
      expect(buf).to.deep.equal(
        Buffer.from([JACK | MACK | PACK | NACK | QUACK]),
      );
    });

    bitfield.encode(stream, {
      Jack: true,
      Kack: false,
      Lack: false,
      Mack: true,
      Nack: true,
      Oack: false,
      Pack: true,
      Quack: true,
    });
    stream.end();
    await expectation;
  });
});
