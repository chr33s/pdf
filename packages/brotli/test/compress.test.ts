import zlib from "node:zlib";
import { describe, expect, it } from "vitest";

import { compress } from "../dist/compress.js";
import { decompress } from "../dist/decompress.js";
import { readFileSync } from "./utils.js";

describe("compress", function () {
  it("should compress some binary data", function () {
    const data = readFileSync("../dist/brotli.js").slice(0, 1024 * 4);
    const res = compress(data);
    expect(res!.length).toBeLessThan(data.length);
  });

  it("should compress some binary data using standalone version", function () {
    const data = readFileSync("../dist/brotli.js").slice(0, 1024 * 4);
    const res = compress(data);
    expect(res!.length).toBeLessThan(data.length);
  });

  it("should compress some text data", function () {
    const data = readFileSync("../dist/brotli.js", "utf8").slice(0, 1024 * 4);
    const res = compress(data, true);
    expect(res!.length).toBeLessThan(data.length);
  });

  it("should compress some text data using standalone version", function () {
    const data = readFileSync("../dist/brotli.js", "utf8").slice(0, 1024 * 4);
    const res = compress(data, true);
    expect(res!.length).toBeLessThan(data.length);
  });

  it("compress some text with a dictionary", function () {
    const dictionary = readFileSync("data/alice29.txt");
    const data = readFileSync("data/alice30.txt");
    const res = compress(data, { dictionary });
    expect(res).not.toBeNull();
    expect(res!.length).toBeLessThan(data.length);
    const decoded = decompress(res!, { dictionary });
    expect(Buffer.from(decoded!)).toStrictEqual(data);
  });

  it("should compress short data", function () {
    const res = compress(Buffer.from([255, 255, 255]));
    expect(res!.length).toBeGreaterThan(3);
  });

  it("should match node:zlib#brotli", function () {
    const data = readFileSync("../dist/brotli.js").slice(0, 1024 * 4);
    const result = compress(data);
    const expected = zlib.brotliCompressSync(data);
    expect(Buffer.from(result!)).toEqual(expected);
  });
});
