import fs from "fs";

import FlateStream from "../../../src/core/streams/FlateStream";
import Stream from "../../../src/core/streams/Stream";

const FILES = ["1", "2", "3", "4", "5", "6", "7"];

describe("FlateStream", () => {
  FILES.forEach((file) => {
    it(`can decode flate encoded data (${file})`, () => {
      const encoded = new Uint8Array(
        fs.readFileSync(
          new URL(`./data/flate/${file}.encoded`, import.meta.url),
        ),
      );
      const decoded = new Uint8Array(
        fs.readFileSync(
          new URL(`./data/flate/${file}.decoded`, import.meta.url),
        ),
      );

      const stream = new FlateStream(new Stream(encoded));

      expect(stream.decode()).toEqual(decoded);
    });
  });
});
