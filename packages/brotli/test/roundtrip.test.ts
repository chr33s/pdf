import { describe, expect, it } from "vitest";

import { compress } from "../dist/compress.js";
import { decompress } from "../dist/decompress.js";
import { readFileSync } from "./utils.js";

describe("roundtrip", function () {
  const files = ["alice29.txt", "asyoulik.txt", "lcet10.txt", "plrabn12.txt"];
  files.forEach(function (file) {
    it(file, function () {
      const input = readFileSync(`data/${file}`);
      const compressed = compress(input);
      const decompressed = decompress(compressed!);
      expect(input.length).toBe(decompressed!.length);
      expect(Buffer.from(decompressed!)).toStrictEqual(input);
    });
  });
});
