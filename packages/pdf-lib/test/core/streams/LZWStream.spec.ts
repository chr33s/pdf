import fs from "fs";

import LZWStream from "../../../src/core/streams/LZWStream";
import Stream from "../../../src/core/streams/Stream";

const FILES = ["1", "2", "3", "4"];

describe("LZWStream", () => {
  FILES.forEach((file) => {
    it(`can decode LZW encoded data (${file})`, () => {
      const encoded = new Uint8Array(
        fs.readFileSync(new URL(`./data/lzw/${file}.encoded`, import.meta.url)),
      );
      const decoded = new Uint8Array(
        fs.readFileSync(new URL(`./data/lzw/${file}.decoded`, import.meta.url)),
      );

      const stream = new LZWStream(new Stream(encoded), undefined, 0);

      expect(stream.decode()).toEqual(decoded);
    });
  });
});
