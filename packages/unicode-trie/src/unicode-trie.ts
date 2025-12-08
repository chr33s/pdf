import { inflate } from "@chr33s/pdf-common";
import { swap32LE } from "./swap.js";

export type UnicodeTrieJSON = {
  data: Uint32Array | Int32Array;
  highStart: number;
  errorValue: number;
};

export type UnicodeTrieInit = ArrayBufferLike | ArrayBufferView | UnicodeTrieJSON;

const SHIFT_1 = 6 + 5;
const SHIFT_2 = 5;
const SHIFT_1_2 = SHIFT_1 - SHIFT_2;
const OMITTED_BMP_INDEX_1_LENGTH = 0x10000 >> SHIFT_1;
const INDEX_2_BLOCK_LENGTH = 1 << SHIFT_1_2;
const INDEX_2_MASK = INDEX_2_BLOCK_LENGTH - 1;
const INDEX_SHIFT = 2;
const DATA_BLOCK_LENGTH = 1 << SHIFT_2;
const DATA_MASK = DATA_BLOCK_LENGTH - 1;
const LSCP_INDEX_2_OFFSET = 0x10000 >> SHIFT_2;
const LSCP_INDEX_2_LENGTH = 0x400 >> SHIFT_2;
const INDEX_2_BMP_LENGTH = LSCP_INDEX_2_OFFSET + LSCP_INDEX_2_LENGTH;
const UTF8_2B_INDEX_2_OFFSET = INDEX_2_BMP_LENGTH;
const UTF8_2B_INDEX_2_LENGTH = 0x800 >> 6;
const INDEX_1_OFFSET = UTF8_2B_INDEX_2_OFFSET + UTF8_2B_INDEX_2_LENGTH;
const DATA_GRANULARITY = 1 << INDEX_SHIFT;

const isUnicodeTrieJSON = (value: UnicodeTrieInit): value is UnicodeTrieJSON => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("data" in value) || !("highStart" in value) || !("errorValue" in value)) {
    return false;
  }

  const candidate = value as Partial<UnicodeTrieJSON>;
  return (
    (candidate.data instanceof Uint32Array || candidate.data instanceof Int32Array) &&
    typeof candidate.highStart === "number" &&
    typeof candidate.errorValue === "number"
  );
};

const toUint8Array = (value: ArrayBufferLike | ArrayBufferView): Uint8Array => {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  if (typeof SharedArrayBuffer !== "undefined" && value instanceof SharedArrayBuffer) {
    return new Uint8Array(value);
  }

  return new Uint8Array(value);
};

/**
 * A compact read-only data structure for fast Unicode property lookups.
 * Uses a two-stage trie with Latin-1 linear array optimization.
 */
class UnicodeTrie {
  readonly data: Uint32Array;
  readonly highStart: number;
  readonly errorValue: number;

  private constructor(data: Uint32Array, highStart: number, errorValue: number) {
    this.data = data;
    this.highStart = highStart;
    this.errorValue = errorValue;
  }

  /**
   * Create a UnicodeTrie from a JSON object (synchronous)
   */
  static fromJSON(source: UnicodeTrieJSON): UnicodeTrie {
    const typedData =
      source.data instanceof Uint32Array ? source.data : new Uint32Array(source.data);
    return new UnicodeTrie(typedData, source.highStart, source.errorValue);
  }

  /**
   * Create a UnicodeTrie from compressed binary data (async)
   */
  static async fromBuffer(source: ArrayBufferLike | ArrayBufferView): Promise<UnicodeTrie> {
    const bytes = toUint8Array(source);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const highStart = view.getUint32(0, true);
    const errorValue = view.getUint32(4, true);
    // uncompressedLength at offset 8 is not needed for async inflate

    let payload = bytes.subarray(12);
    payload = await inflate(payload, "deflate-raw");
    payload = await inflate(payload, "deflate-raw");
    swap32LE(payload);

    const data = new Uint32Array(
      payload.buffer,
      payload.byteOffset,
      payload.byteLength / Uint32Array.BYTES_PER_ELEMENT,
    );

    return new UnicodeTrie(data, highStart, errorValue);
  }

  /**
   * Create a UnicodeTrie from any supported source (async)
   */
  static async create(source: UnicodeTrieInit): Promise<UnicodeTrie> {
    if (isUnicodeTrieJSON(source)) {
      return UnicodeTrie.fromJSON(source);
    }
    return UnicodeTrie.fromBuffer(source);
  }

  get(codePoint: number): number {
    if (codePoint < 0 || codePoint > 0x10ffff) {
      return this.errorValue;
    }

    if (codePoint < 0xd800 || (codePoint > 0xdbff && codePoint <= 0xffff)) {
      const index = (this.data[codePoint >> SHIFT_2] << INDEX_SHIFT) + (codePoint & DATA_MASK);
      return this.data[index];
    }

    if (codePoint <= 0xffff) {
      const index =
        (this.data[LSCP_INDEX_2_OFFSET + ((codePoint - 0xd800) >> SHIFT_2)] << INDEX_SHIFT) +
        (codePoint & DATA_MASK);
      return this.data[index];
    }

    if (codePoint < this.highStart) {
      let index = this.data[INDEX_1_OFFSET - OMITTED_BMP_INDEX_1_LENGTH + (codePoint >> SHIFT_1)];
      index = this.data[index + ((codePoint >> SHIFT_2) & INDEX_2_MASK)];
      index = (index << INDEX_SHIFT) + (codePoint & DATA_MASK);
      return this.data[index];
    }

    return this.data[this.data.length - DATA_GRANULARITY];
  }
}

export default UnicodeTrie;
