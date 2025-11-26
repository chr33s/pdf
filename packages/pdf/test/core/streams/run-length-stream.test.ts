import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";

import RunLengthStream from "../../../src/core/streams/run-length-stream.js";
import Stream from "../../../src/core/streams/stream.js";

const FILES = ["1", "2", "3", "4", "5"];

describe("RunLengthStream", () => {
  test.each(FILES)("can decode run length encoded data (%s)", async (file) => {
    const encoded = new Uint8Array(
      await readFile(new URL(`./data/runlength/${file}.encoded`, import.meta.url)),
    );
    const decoded = new Uint8Array(
      await readFile(new URL(`./data/runlength/${file}.decoded`, import.meta.url)),
    );

    const stream = new RunLengthStream(new Stream(encoded));

    expect(stream.decode()).toEqual(decoded);
  });
});
