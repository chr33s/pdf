import fs from "node:fs";
import { describe, expect, test } from "vitest";

import FlateStream from "../../../src/core/streams/flate-stream.js";
import Stream from "../../../src/core/streams/stream.js";

const FILES = ["1", "2", "3", "4", "5", "6", "7"];

describe("FlateStream", () => {
  test.each(FILES)("can decode flate encoded data (%s)", (file) => {
    const encoded = new Uint8Array(
      fs.readFileSync(new URL(`./data/flate/${file}.encoded`, import.meta.url)),
    );
    const decoded = new Uint8Array(
      fs.readFileSync(new URL(`./data/flate/${file}.decoded`, import.meta.url)),
    );

    const stream = new FlateStream(new Stream(encoded));

    expect(stream.decode()).toEqual(decoded);
  });
});
