import fs from "node:fs";
import { describe, expect, it } from "vitest";

import RunLengthStream from "../../../src/core/streams/run-length-stream.js";
import Stream from "../../../src/core/streams/stream.js";

const FILES = ["1", "2", "3", "4", "5"];

describe("RunLengthStream", () => {
  FILES.forEach((file) => {
    it(`can decode run length encoded data (${file})`, () => {
      const encoded = new Uint8Array(
        fs.readFileSync(
          new URL(`./data/runlength/${file}.encoded`, import.meta.url),
        ),
      );
      const decoded = new Uint8Array(
        fs.readFileSync(
          new URL(`./data/runlength/${file}.decoded`, import.meta.url),
        ),
      );

      const stream = new RunLengthStream(new Stream(encoded));

      expect(stream.decode()).toEqual(decoded);
    });
  });
});
