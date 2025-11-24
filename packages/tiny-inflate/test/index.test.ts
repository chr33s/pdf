import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { constants, createDeflateRaw } from "node:zlib";
import { beforeAll, describe, expect, test } from "vitest";
import inflate from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uncompressed = readFileSync(join(__dirname, "lorem.txt"));

type DeflateOptions = Parameters<typeof createDeflateRaw>[0];

async function deflateRaw(
  buffer: Buffer,
  options?: DeflateOptions,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = createDeflateRaw(options);

    stream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    stream.on("error", (error) => {
      reject(error);
    });

    stream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    stream.end(buffer);
  });
}

describe("tiny-inflate", () => {
  let compressed: Buffer;
  let noCompression: Buffer;
  let fixed: Buffer;

  beforeAll(async () => {
    compressed = await deflateRaw(uncompressed);
  });

  beforeAll(async () => {
    noCompression = await deflateRaw(uncompressed, {
      level: constants.Z_NO_COMPRESSION,
    });
  });

  beforeAll(async () => {
    fixed = await deflateRaw(uncompressed, { strategy: constants.Z_FIXED });
  });

  test("inflates raw DEFLATE data", () => {
    const output = Buffer.allocUnsafe(uncompressed.length);
    inflate(compressed, output);
    expect(output.equals(uncompressed)).toBe(true);
  });

  test("slices oversized output buffers", () => {
    const output = Buffer.alloc(uncompressed.length + 1024);
    const result = inflate(compressed, output);
    expect(Buffer.from(result)).toStrictEqual(uncompressed);
    expect(result.length).toBe(uncompressed.length);
  });

  test("handles uncompressed blocks", () => {
    const output = Buffer.allocUnsafe(uncompressed.length);
    inflate(noCompression, output);
    expect(output.equals(uncompressed)).toBe(true);
  });

  test("handles fixed Huffman blocks", () => {
    const output = Buffer.allocUnsafe(uncompressed.length);
    inflate(fixed, output);
    expect(output.equals(uncompressed)).toBe(true);
  });

  test("supports typed arrays", () => {
    const input = new Uint8Array(compressed);
    const output = new Uint8Array(uncompressed.length);
    inflate(input, output);
    expect(output).toEqual(new Uint8Array(uncompressed));
  });
});
