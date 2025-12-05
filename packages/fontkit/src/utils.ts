import { DecodeStream, EncodeStream } from "@chr33s/pdf-restructure";

export function binarySearch<T>(arr: T[], cmp: (value: T) => number): number {
  let min = 0;
  let max = arr.length - 1;
  while (min <= max) {
    let mid = (min + max) >> 1;
    let res = cmp(arr[mid]);

    if (res < 0) {
      max = mid - 1;
    } else if (res > 0) {
      min = mid + 1;
    } else {
      return mid;
    }
  }

  return -1;
}

export function range(index: number, end: number): number[] {
  let range: number[] = [];
  while (index < end) {
    range.push(index++);
  }
  return range;
}

export class Version16Dot16 {
  fromBuffer(buffer: Buffer | Uint8Array): number {
    let stream = new DecodeStream(buffer);
    return this.decode(stream);
  }

  toBuffer(value: number): Uint8Array {
    let size = this.size();
    let buffer = new Uint8Array(size);
    let stream = new EncodeStream(buffer);
    this.encode(stream, value);
    return buffer;
  }

  size(): number {
    return 4;
  }

  decode(stream: InstanceType<typeof DecodeStream>): number {
    let major = stream.readUInt16BE();
    let minor = stream.readUInt16BE() >> 12;
    return major + minor / 10;
  }

  encode(stream: InstanceType<typeof EncodeStream>, val: number): void {
    let major = Math.trunc(val);
    let minor = (val - major) * 10;
    stream.writeUInt16BE(major);
    stream.writeUInt16BE(minor << 12);
  }
}

export const version16Dot16 = new Version16Dot16();
