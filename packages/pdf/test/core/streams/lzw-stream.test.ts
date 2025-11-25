import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";

import LZWStream from "../../../src/core/streams/lzw-stream.js";
import Stream from "../../../src/core/streams/stream.js";

const FILES = ["1", "2", "3", "4"];

describe("LZWStream", () => {
  test.each(FILES)("can decode LZW encoded data (%s)", async (file) => {
    const encoded = new Uint8Array(
      await readFile(new URL(`./data/lzw/${file}.encoded`, import.meta.url)),
    );
    const decoded = new Uint8Array(
      await readFile(new URL(`./data/lzw/${file}.decoded`, import.meta.url)),
    );

    const stream = new LZWStream(new Stream(encoded), undefined, 0);

    expect(stream.decode()).toEqual(decoded);
  });
});
