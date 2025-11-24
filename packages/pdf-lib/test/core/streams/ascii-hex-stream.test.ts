import fs from "node:fs";
import { describe, expect, it } from "vitest";

import AsciiHexStream from "../../../src/core/streams/ascii-hex-stream.js";
import Stream from "../../../src/core/streams/stream.js";

const FILES = ["1", "2"];

describe("AsciiHexStream", () => {
  FILES.forEach((file) => {
    it(`can decode ascii hex encoded data (${file})`, () => {
      const encoded = new Uint8Array(
        fs.readFileSync(
          new URL(`./data/asciihex/${file}.encoded`, import.meta.url),
        ),
      );
      const decoded = new Uint8Array(
        fs.readFileSync(
          new URL(`./data/asciihex/${file}.decoded`, import.meta.url),
        ),
      );

      const stream = new AsciiHexStream(new Stream(encoded));

      expect(stream.decode()).toEqual(decoded);
    });
  });
});
