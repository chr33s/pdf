import type { DecodeStream, EncodeStream } from "@chr33s/restructure";

const FLOAT_EOF = 0xf;
const FLOAT_LOOKUP = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ".",
  "E",
  "E-",
  null,
  "-",
];

const FLOAT_ENCODE_LOOKUP: Record<string, number> = {
  ".": 10,
  E: 11,
  "E-": 12,
  "-": 14,
};

type ForceLargeValue = {
  forceLarge?: boolean;
  valueOf(): number;
};

export type OperandValue = number | ForceLargeValue;

export default class CFFOperand {
  static decode(stream: DecodeStream, value: number) {
    if (32 <= value && value <= 246) {
      return value - 139;
    }

    if (247 <= value && value <= 250) {
      return (value - 247) * 256 + stream.readUInt8() + 108;
    }

    if (251 <= value && value <= 254) {
      return -(value - 251) * 256 - stream.readUInt8() - 108;
    }

    if (value === 28) {
      return stream.readInt16BE();
    }

    if (value === 29) {
      return stream.readInt32BE();
    }

    if (value === 30) {
      let str = "";
      while (true) {
        const b = stream.readUInt8();

        const n1 = b >> 4;
        if (n1 === FLOAT_EOF) {
          break;
        }
        str += FLOAT_LOOKUP[n1];

        const n2 = b & 15;
        if (n2 === FLOAT_EOF) {
          break;
        }
        str += FLOAT_LOOKUP[n2];
      }

      return parseFloat(str);
    }

    return null;
  }

  static size(value: OperandValue) {
    // if the value needs to be forced to the largest size (32 bit)
    // e.g. for unknown pointers, set to 32768
    if (typeof value !== "number" && value.forceLarge) {
      value = 32768;
    }

    const numericValue = Number(value);

    if ((numericValue | 0) !== numericValue) {
      // floating point
      const str = String(numericValue);
      return 1 + Math.ceil((str.length + 1) / 2);
    }

    const intVal = numericValue;
    if (-107 <= intVal && intVal <= 107) {
      return 1;
    }

    if (
      (108 <= intVal && intVal <= 1131) ||
      (-1131 <= intVal && intVal <= -108)
    ) {
      return 2;
    }

    if (-32768 <= intVal && intVal <= 32767) {
      return 3;
    }

    return 5;
  }

  static encode(stream: EncodeStream, value: OperandValue) {
    // if the value needs to be forced to the largest size (32 bit)
    // e.g. for unknown pointers, save the old value and set to 32768
    let val = Number(value);

    if (typeof value !== "number" && value.forceLarge) {
      stream.writeUInt8(29);
      return stream.writeInt32BE(val);
    }

    if ((val | 0) !== val) {
      // floating point
      stream.writeUInt8(30);

      const str = String(val);
      let n2 = FLOAT_EOF;
      for (let i = 0; i < str.length; i += 2) {
        const c1 = str[i];
        const n1 = FLOAT_ENCODE_LOOKUP[c1] ?? +c1;

        if (i === str.length - 1) {
          n2 = FLOAT_EOF;
        } else {
          const c2 = str[i + 1];
          n2 = FLOAT_ENCODE_LOOKUP[c2] ?? +c2;
        }

        stream.writeUInt8((n1 << 4) | (n2 & 15));
      }

      if (n2 !== FLOAT_EOF) {
        stream.writeUInt8(FLOAT_EOF << 4);
      }
      return;
    }

    if (-107 <= val && val <= 107) {
      return stream.writeUInt8(val + 139);
    }

    if (108 <= val && val <= 1131) {
      val -= 108;
      stream.writeUInt8((val >> 8) + 247);
      return stream.writeUInt8(val & 0xff);
    }

    if (-1131 <= val && val <= -108) {
      val = -val - 108;
      stream.writeUInt8((val >> 8) + 251);
      return stream.writeUInt8(val & 0xff);
    }

    if (-32768 <= val && val <= 32767) {
      stream.writeUInt8(28);
      return stream.writeInt16BE(val);
    }

    stream.writeUInt8(29);
    return stream.writeInt32BE(val);
  }
}
