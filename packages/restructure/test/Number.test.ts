import { describe, expect, it } from "vitest";
import {
  DecodeStream,
  double,
  doublebe,
  doublele,
  EncodeStream,
  fixed16,
  fixed16be,
  fixed16le,
  fixed32,
  fixed32be,
  fixed32le,
  float,
  floatbe,
  floatle,
  int16,
  int16be,
  int16le,
  int24,
  int24be,
  int24le,
  int32,
  int32be,
  int32le,
  int8,
  uint16,
  uint16be,
  uint16le,
  uint24,
  uint24be,
  uint24le,
  uint32,
  uint32be,
  uint32le,
  uint8,
} from "../src";
import { expectStream } from "./helpers";

type IntegerCase = {
  name: string;
  type: any;
  buffer: number[];
  expected: number[];
  size: number;
};

const integerCases: IntegerCase[] = [
  {
    name: "uint8",
    type: uint8,
    buffer: [0xab, 0xff],
    expected: [0xab, 0xff],
    size: 1,
  },
  {
    name: "uint16be",
    type: uint16be,
    buffer: [0xab, 0xff],
    expected: [0xabff],
    size: 2,
  },
  {
    name: "uint16le",
    type: uint16le,
    buffer: [0xff, 0xab],
    expected: [0xabff],
    size: 2,
  },
  {
    name: "uint24be",
    type: uint24be,
    buffer: [0xff, 0xab, 0x24],
    expected: [0xffab24],
    size: 3,
  },
  {
    name: "uint24le",
    type: uint24le,
    buffer: [0x24, 0xab, 0xff],
    expected: [0xffab24],
    size: 3,
  },
  {
    name: "uint32be",
    type: uint32be,
    buffer: [0xff, 0xab, 0x24, 0xbf],
    expected: [0xffab24bf],
    size: 4,
  },
  {
    name: "uint32le",
    type: uint32le,
    buffer: [0xbf, 0x24, 0xab, 0xff],
    expected: [0xffab24bf],
    size: 4,
  },
  {
    name: "int8",
    type: int8,
    buffer: [0x7f, 0xff],
    expected: [127, -1],
    size: 1,
  },
  {
    name: "int16be",
    type: int16be,
    buffer: [0xff, 0xab],
    expected: [-85],
    size: 2,
  },
  {
    name: "int16le",
    type: int16le,
    buffer: [0xab, 0xff],
    expected: [-85],
    size: 2,
  },
  {
    name: "int24be",
    type: int24be,
    buffer: [0xff, 0xab, 0x24],
    expected: [-21724],
    size: 3,
  },
  {
    name: "int24le",
    type: int24le,
    buffer: [0x24, 0xab, 0xff],
    expected: [-21724],
    size: 3,
  },
  {
    name: "int32be",
    type: int32be,
    buffer: [0xff, 0xab, 0x24, 0xbf],
    expected: [-5561153],
    size: 4,
  },
  {
    name: "int32le",
    type: int32le,
    buffer: [0xbf, 0x24, 0xab, 0xff],
    expected: [-5561153],
    size: 4,
  },
];

type FloatCase = {
  name: string;
  type: any;
  buffer: number[];
  expected: number;
  size: number;
  precision?: number;
};

const floatCases: FloatCase[] = [
  {
    name: "floatbe",
    type: floatbe,
    buffer: [0x43, 0x7a, 0x8c, 0xcd],
    expected: 250.55,
    size: 4,
    precision: 0.005,
  },
  {
    name: "floatle",
    type: floatle,
    buffer: [0xcd, 0x8c, 0x7a, 0x43],
    expected: 250.55,
    size: 4,
    precision: 0.005,
  },
  {
    name: "doublebe",
    type: doublebe,
    buffer: [0x40, 0x93, 0x4a, 0x3d, 0x70, 0xa3, 0xd7, 0x0a],
    expected: 1234.56,
    size: 8,
  },
  {
    name: "doublele",
    type: doublele,
    buffer: [0x0a, 0xd7, 0xa3, 0x70, 0x3d, 0x4a, 0x93, 0x40],
    expected: 1234.56,
    size: 8,
  },
  {
    name: "fixed16be",
    type: fixed16be,
    buffer: [0x19, 0x57],
    expected: 25.34,
    size: 2,
    precision: 0.005,
  },
  {
    name: "fixed16le",
    type: fixed16le,
    buffer: [0x57, 0x19],
    expected: 25.34,
    size: 2,
    precision: 0.005,
  },
  {
    name: "fixed32be",
    type: fixed32be,
    buffer: [0x00, 0xfa, 0x8c, 0xcc],
    expected: 250.55,
    size: 4,
    precision: 0.005,
  },
  {
    name: "fixed32le",
    type: fixed32le,
    buffer: [0xcc, 0x8c, 0xfa, 0x00],
    expected: 250.55,
    size: 4,
    precision: 0.005,
  },
];

const aliasCases: Array<[string, any, any]> = [
  ["uint16", uint16, uint16be],
  ["uint24", uint24, uint24be],
  ["uint32", uint32, uint32be],
  ["int16", int16, int16be],
  ["int24", int24, int24be],
  ["int32", int32, int32be],
  ["float", float, floatbe],
  ["double", double, doublebe],
  ["fixed16", fixed16, fixed16be],
  ["fixed32", fixed32, fixed32be],
];

describe("Number", () => {
  aliasCases.forEach(([name, alias, target]) => {
    it(`${name} should alias the big-endian variant`, () => {
      expect(alias).to.equal(target);
    });
  });

  integerCases.forEach(({ name, type, buffer, expected, size }) => {
    describe(name, () => {
      it("should decode", () => {
        const stream = new DecodeStream(Buffer.from(buffer));
        expected.forEach((value) => {
          expect(type.decode(stream)).to.equal(value);
        });
      });

      it("should report size", () => {
        expect(type.size()).to.equal(size);
      });

      it("should encode", async () => {
        const stream = new EncodeStream();
        const expectation = expectStream(stream, (buf) => {
          expect(buf).to.deep.equal(Buffer.from(buffer));
        });

        expected.forEach((value) => {
          type.encode(stream, value);
        });
        stream.end();
        await expectation;
      });
    });
  });

  floatCases.forEach(({ name, type, buffer, expected, size, precision }) => {
    describe(name, () => {
      it("should decode", () => {
        const stream = new DecodeStream(Buffer.from(buffer));
        const value = type.decode(stream);
        if (precision) {
          expect(value).to.be.closeTo(expected, precision);
        } else {
          expect(value).to.equal(expected);
        }
      });

      it("should report size", () => {
        expect(type.size()).to.equal(size);
      });

      it("should encode", async () => {
        const stream = new EncodeStream();
        const expectation = expectStream(stream, (buf) => {
          expect(buf).to.deep.equal(Buffer.from(buffer));
        });

        type.encode(stream, expected);
        stream.end();
        await expectation;
      });
    });
  });
});
