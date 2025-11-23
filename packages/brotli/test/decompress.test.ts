import zlib from "node:zlib";
import { describe, expect, it } from "vitest";

import { decompress } from "../dist/decompress.js";
import { readdirSync, readFileSync } from "./utils.js";

describe("decompress", async function () {
  readdirSync("data").forEach(async function (file) {
    if (!/\.compressed/.test(file)) return;

    it(file, async function () {
      const compressed = readFileSync(`data/${file}`);
      const expected = readFileSync(
        `data/${file.replace(/\.compressed.*/, "")}`,
      );
      const result = decompress(compressed);
      expect(Buffer.from(result!)).toStrictEqual(expected);
    });
  });

  it.skip("should match node:zlib", async function () {
    const data = zlib.brotliCompressSync(
      readFileSync("../dist/brotli.js").slice(0, 1024 * 4),
    );
    const mod = decompress(data);
    const node = zlib.brotliDecompressSync(data);
    expect(Buffer.from(mod!)).toStrictEqual(node);
  });
});
