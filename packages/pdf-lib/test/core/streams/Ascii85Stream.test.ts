import fs from "node:fs";
import { describe, expect, it } from "vitest";

import Ascii85Stream from "../../../src/core/streams/Ascii85Stream.js";
import Stream from "../../../src/core/streams/Stream.js";

const FILES = ["1"];

describe("Ascii85Stream", () => {
  FILES.forEach((file) => {
    it(`can decode ascii 85 encoded data (${file})`, () => {
      const encoded = new Uint8Array(
        fs.readFileSync(
          new URL(`./data/ascii85/${file}.encoded`, import.meta.url),
        ),
      );
      const decoded = new Uint8Array(
        fs.readFileSync(
          new URL(`./data/ascii85/${file}.decoded`, import.meta.url),
        ),
      );

      const stream = new Ascii85Stream(new Stream(encoded));

      expect(stream.decode()).toEqual(decoded);
    });
  });
});
