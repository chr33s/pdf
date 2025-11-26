import zlib from "node:zlib";
import { describe, expect, test } from "vitest";

import { decompress } from "../dist/decompress.js";
import { normalize, readdir, readFile } from "./utils.js";

const brotliBinary = await readFile("../dist/brotli.js");
const compressedFiles = (await readdir("data")).filter((file) => /\.compressed/.test(file));

describe("decompress", function () {
  test.each(compressedFiles)(`%s`, async function (file) {
    const compressed = await readFile(`data/${file}`);
    const expected = await readFile(`data/${file.replace(/\.compressed.*/, "")}`);
    const result = decompress(compressed);
    expect(normalize(result!)).toStrictEqual(normalize(expected));
  });

  test("should match node:zlib#brotli", function () {
    const data = zlib.brotliCompressSync(brotliBinary.slice(0, 1024 * 4));
    const result = decompress(data);
    const expected = zlib.brotliDecompressSync(data);
    expect(Buffer.from(result!)).toStrictEqual(expected);
  });
});
