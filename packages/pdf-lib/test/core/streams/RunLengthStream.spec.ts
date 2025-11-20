import fs from "fs";

import RunLengthStream from "../../../src/core/streams/RunLengthStream";
import Stream from "../../../src/core/streams/Stream";

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
