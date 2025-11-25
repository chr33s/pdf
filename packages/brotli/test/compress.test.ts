import zlib from "node:zlib";
import { describe, expect, test } from "vitest";

import { compress } from "../dist/compress.js";
import { decompress } from "../dist/decompress.js";
import { readFile } from "./utils.js";

const brotliBinary = await readFile("../dist/brotli.js");
const brotliText = await readFile("../dist/brotli.js", "utf8");
const alice29 = await readFile("data/alice29.txt");
const alice30 = await readFile("data/alice30.txt");

describe("compress", function () {
  test("should compress some binary data", function () {
    const data = brotliBinary.slice(0, 1024 * 4);
    const res = compress(data);
    expect(res!.length).toBeLessThan(data.length);
  });

  test("should compress some binary data using standalone version", function () {
    const data = brotliBinary.slice(0, 1024 * 4);
    const res = compress(data);
    expect(res!.length).toBeLessThan(data.length);
  });

  test("should compress some text data", function () {
    const data = brotliText.slice(0, 1024 * 4);
    const res = compress(data, true);
    expect(res!.length).toBeLessThan(data.length);
  });

  test("should compress some text data using standalone version", function () {
    const data = brotliText.slice(0, 1024 * 4);
    const res = compress(data, true);
    expect(res!.length).toBeLessThan(data.length);
  });

  test("compress some text with a dictionary", function () {
    const dictionary = alice29;
    const data = alice30;
    const res = compress(data, { dictionary });
    expect(res).not.toBeNull();
    expect(res!.length).toBeLessThan(data.length);
    const decoded = decompress(res!, { dictionary });
    expect(Buffer.from(decoded!)).toStrictEqual(data);
  });

  test("should compress short data", function () {
    const res = compress(Buffer.from([255, 255, 255]));
    expect(res!.length).toBeGreaterThan(3);
  });

  test("should match node:zlib#brotli", function () {
    const data = brotliBinary.slice(0, 1024 * 4);
    const result = compress(data);
    const expected = zlib.brotliCompressSync(data);
    expect(Buffer.from(result!)).toEqual(expected);
  });
});
