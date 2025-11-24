import zlib from "node:zlib";
import { describe, expect, test } from "vitest";

import { decompress } from "../dist/decompress.js";
import { normalize, readdirSync, readFileSync } from "./utils.js";

describe("decompress", function () {
  const data = readdirSync("data").filter((file) => /\.compressed/.test(file));
  test.each(data)(`%s`, function (file) {
    const compressed = readFileSync(`data/${file}`);
    const expected = readFileSync(`data/${file.replace(/\.compressed.*/, "")}`);
    const result = decompress(compressed);
    expect(normalize(result!)).toStrictEqual(normalize(expected));
  });

  test("should match node:zlib#brotli", function () {
    const data = zlib.brotliCompressSync(
      readFileSync("../dist/brotli.js").slice(0, 1024 * 4),
    );
    const result = decompress(data);
    const expected = zlib.brotliDecompressSync(data);
    expect(Buffer.from(result!)).toStrictEqual(expected);
  });
});
