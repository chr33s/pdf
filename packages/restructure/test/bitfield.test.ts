import { describe, expect, test } from "vitest";
import { Bitfield, uint8 } from "../src/index.js";

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

  test("should have the right size", () => {
    expect(bitfield.size()).to.equal(1);
  });

  test("should decode", () => {
    expect(bitfield.fromBuffer(new Uint8Array([JACK | MACK | PACK | NACK | QUACK]))).to.deep.equal({
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

  test("should encode", () => {
    expect(
      bitfield.toBuffer({
        Jack: true,
        Kack: false,
        Lack: false,
        Mack: true,
        Nack: true,
        Oack: false,
        Pack: true,
        Quack: true,
      }),
    ).to.deep.equal(new Uint8Array([JACK | MACK | PACK | NACK | QUACK]));
  });
});
