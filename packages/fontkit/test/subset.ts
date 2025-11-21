// @ts-nocheck

import * as r from "@chr33s/restructure";
import assert from "assert";
import concat from "concat-stream";
import fs from "fs";
import { describe, it } from "vitest";

import CFFFont from "../src/cff/CFFFont.js";
import CFFGlyph from "../src/glyph/CFFGlyph.js";
import fontkit from "./addTestHelpersToFontkit.js";
import { here } from "./utils/dir.js";

const __dirname = here(import.meta.url);

function encodeSubset(subset) {
  return new Promise<Buffer>((resolve, reject) => {
    const stream = subset.encodeStream();
    stream.on("error", reject);
    stream.pipe(
      concat(function (buf) {
        resolve(buf);
      }),
    );
  });
}

describe("font subsetting", function () {
  describe("truetype subsetting", function () {
    let font = fontkit.openSync(
      __dirname + "/data/OpenSans/OpenSans-Regular.ttf",
    );

    it("should create a TTFSubset instance", function () {
      let subset = font.createSubset();
      assert.equal(subset.constructor.name, "TTFSubset");
    });

    it("should produce a subset", async function () {
      let subset = font.createSubset();
      for (let glyph of font.glyphsForString("hello")) {
        subset.includeGlyph(glyph);
      }

      const buf = await encodeSubset(subset);
      let f = fontkit.create(buf);
      assert.equal(f.numGlyphs, 5);
      assert.equal(
        f.getGlyph(1).path.toSVG(),
        font.glyphsForString("h")[0].path.toSVG(),
      );
    });

    it("should re-encode variation glyphs", async function () {
      if (!fs.existsSync("/Library/Fonts/Skia.ttf")) {
        return;
      }

      let font = fontkit.openSync("/Library/Fonts/Skia.ttf", "Bold");
      let subset = font.createSubset();
      for (let glyph of font.glyphsForString("e")) {
        subset.includeGlyph(glyph);
      }

      const buf = await encodeSubset(subset);
      let f = fontkit.create(buf);
      assert.equal(
        f.getGlyph(1).path.toSVG(),
        font.glyphsForString("e")[0].path.toSVG(),
      );
    });

    it("should handle composite glyphs", async function () {
      let subset = font.createSubset();
      subset.includeGlyph(font.glyphsForString("é")[0]);

      const buf = await encodeSubset(subset);
      let f = fontkit.create(buf);
      assert.equal(f.numGlyphs, 4);
      assert.equal(
        f.getGlyph(1).path.toSVG(),
        font.glyphsForString("é")[0].path.toSVG(),
      );
    });
  });

  describe("CFF subsetting", function () {
    let font = fontkit.openSync(
      __dirname + "/data/SourceSansPro/SourceSansPro-Regular.otf",
    );

    it("should create a CFFSubset instance", function () {
      let subset = font.createSubset();
      return assert.equal(subset.constructor.name, "CFFSubset");
    });

    it("should produce a subset", async function () {
      let subset = font.createSubset();
      let iterable = font.glyphsForString("hello");
      for (let i = 0; i < iterable.length; i++) {
        let glyph = iterable[i];
        subset.includeGlyph(glyph);
      }

      const buf = await encodeSubset(subset);
      let stream = new r.DecodeStream(buf);
      let cff = new CFFFont(stream);
      let glyph = new CFFGlyph(1, [], { stream, "CFF ": cff });
      assert.equal(
        glyph.path.toSVG(),
        font.glyphsForString("h")[0].path.toSVG(),
      );
    });

    it("should handle CID fonts", async function () {
      let f = fontkit.openSync(
        __dirname + "/data/NotoSansCJK/NotoSansCJKkr-Regular.otf",
      );
      let subset = f.createSubset();
      let iterable = f.glyphsForString("갈휸");
      for (let i = 0; i < iterable.length; i++) {
        let glyph = iterable[i];
        subset.includeGlyph(glyph);
      }

      const buf = await encodeSubset(subset);
      let stream = new r.DecodeStream(buf);
      let cff = new CFFFont(stream);
      let glyph = new CFFGlyph(1, [], { stream, "CFF ": cff });
      assert.equal(glyph.path.toSVG(), f.glyphsForString("갈")[0].path.toSVG());
      assert.equal(cff.topDict.FDArray.length, 2);
      assert.deepEqual(cff.topDict.FDSelect.fds, [0, 1, 1]);
    });
  });
});
