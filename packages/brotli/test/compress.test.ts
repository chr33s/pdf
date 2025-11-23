import zlib from "node:zlib";
import { describe, expect, it } from "vitest";

import { compress } from "../dist/compress.js";
import { decompress } from "../dist/decompress.js";
import { readFileSync } from "./utils.js";

describe("compress", async function () {
  it("should compress some binary data", async function () {
    const data = readFileSync("../dist/brotli.js").slice(0, 1024 * 4);
    const res = await compress(data);
    expect(res!.length).toBeLessThan(data.length);
  });

  it("should compress some binary data using standalone version", async function () {
    const data = readFileSync("../dist/brotli.js").slice(0, 1024 * 4);
    const res = await compress(data);
    expect(res!.length).toBeLessThan(data.length);
  });

  it("should compress some text data", async function () {
    const data = readFileSync("../dist/brotli.js", "utf8").slice(0, 1024 * 4);
    const res = await compress(data, true);
    expect(res!.length).toBeLessThan(data.length);
  });

  it("should compress some text data using standalone version", async function () {
    const data = readFileSync("../dist/brotli.js", "utf8").slice(0, 1024 * 4);
    const res = await compress(data, true);
    expect(res!.length).toBeLessThan(data.length);
  });

  it("compress some text with a dictionary", async function () {
    const dictionary = readFileSync("data/alice29.txt");
    const data = readFileSync("data/alice30.txt");
    const res = await compress(data, { dictionary });
    expect(res).not.toBeNull();
    expect(res!.length).toBeLessThan(data.length);
    const decoded = await decompress(res!, { dictionary });
    expect(Buffer.from(decoded!)).toStrictEqual(data);
  });

  it("should compress short data", async function () {
    const res = await compress(Buffer.from([255, 255, 255]));
    expect(res!.length).toBeGreaterThan(3);
  });

  it.skip("should match node:zlib", async function () {
    const data = readFileSync("../dist/brotli.js").slice(0, 1024 * 4);
    const mod = await compress(data);
    const node = zlib.brotliCompressSync(data);
    expect(mod).toEqual(node);
  });
});
