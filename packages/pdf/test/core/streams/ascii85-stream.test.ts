import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";

import Ascii85Stream from "../../../src/core/streams/ascii85-stream.js";
import Stream from "../../../src/core/streams/stream.js";

const FILES = ["1"];

describe("Ascii85Stream", () => {
  test.each(FILES)("can decode ascii 85 encoded data (%s)", async (file) => {
    const encoded = new Uint8Array(
      await readFile(
        new URL(`./data/ascii85/${file}.encoded`, import.meta.url),
      ),
    );
    const decoded = new Uint8Array(
      await readFile(
        new URL(`./data/ascii85/${file}.decoded`, import.meta.url),
      ),
    );

    const stream = new Ascii85Stream(new Stream(encoded));

    expect(stream.decode()).toEqual(decoded);
  });
});
