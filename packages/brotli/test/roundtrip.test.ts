import { describe, expect, test } from "vitest";

import { compress } from "../dist/compress.js";
import { decompress } from "../dist/decompress.js";
import { readFile } from "./utils.js";

const files = ["alice29.txt", "asyoulik.txt", "lcet10.txt", "plrabn12.txt"] as const;
const fileEntries = await Promise.all(
  files.map(async (file) => [file, await readFile(`data/${file}`)] as const),
);

describe("roundtrip", function () {
  test.each(fileEntries)("%s", function (_label, input) {
    const compressed = compress(input);
    const decompressed = decompress(compressed!);
    expect(input.length).toBe(decompressed!.length);
    expect(Buffer.from(decompressed!)).toStrictEqual(input);
  });
});
