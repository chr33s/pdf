import concat from "concat-stream";
import { access } from "node:fs/promises";
import { describe, expect, test } from "vitest";

import * as r from "@chr33s/restructure";
import CFFFont from "../src/cff/cff-font.js";
import type Subset from "../src/subset/subset.js";
import fontkit from "./add-test-helpers-to-fontkit.js";
import { here } from "./utils/dir.js";

const __dirname = here(import.meta.url);
const SKIA_FONT_PATH = "/Library/Fonts/Skia.ttf";
const hasSkiaFont = await access(SKIA_FONT_PATH)
  .then(() => true)
  .catch(() => false);

function encodeSubset(subset: Subset) {
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
      __dirname + "/data/open-sans/open-sans-regular.ttf",
    );

    test("should create a TTFSubset instance", function () {
      let subset = font.createSubset();
      expect(subset.constructor.name).toBe("TTFSubset");
    });

    test("should produce a subset", async function () {
      let subset = font.createSubset();
      for (let glyph of font.glyphsForString("hello")) {
        subset.includeGlyph(glyph);
      }

      const buf = await encodeSubset(subset);
      let f = fontkit.create(buf);
      expect(f.numGlyphs).toBe(5);
      expect(f.getGlyph(1).path.toSVG()).toBe(
        font.glyphsForString("h")[0].path.toSVG(),
      );
    });

    test.runIf(hasSkiaFont)(
      "should re-encode variation glyphs",
      async function () {
        let font = fontkit.openSync(SKIA_FONT_PATH, "Bold");
        let subset = font.createSubset();
        for (let glyph of font.glyphsForString("e")) {
          subset.includeGlyph(glyph);
        }

        const buf = await encodeSubset(subset);
        let f = fontkit.create(buf);
        expect(f.getGlyph(1).path.toSVG()).toBe(
          font.glyphsForString("e")[0].path.toSVG(),
        );
      },
    );

    test("should handle composite glyphs", async function () {
      let subset = font.createSubset();
      subset.includeGlyph(font.glyphsForString("é")[0]);

      const buf = await encodeSubset(subset);
      let f = fontkit.create(buf);
      expect(f.numGlyphs).toBe(4);
      expect(f.getGlyph(1).path.toSVG()).toBe(
        font.glyphsForString("é")[0].path.toSVG(),
      );
    });
  });

  describe("CFF subsetting", function () {
    let font = fontkit.openSync(
      __dirname + "/data/source-sans-pro/source-sans-pro-regular.otf",
    );

    test("should create a CFFSubset instance", function () {
      let subset = font.createSubset();
      return expect(subset.constructor.name).toBe("CFFSubset");
    });

    test("should produce a subset", async function () {
      let subset = font.createSubset();
      let iterable = font.glyphsForString("hello");
      for (let i = 0; i < iterable.length; i++) {
        let glyph = iterable[i];
        subset.includeGlyph(glyph);
      }

      const buf = await encodeSubset(subset);
      let subsetFont = fontkit.create(buf);
      expect(subsetFont.getGlyph(1).path.toSVG()).toBe(
        font.glyphsForString("h")[0].path.toSVG(),
      );
    });

    test("should handle CID fonts", async function () {
      let f = fontkit.openSync(
        __dirname + "/data/noto-sans-cjk/noto-sans-cj-kkr-regular.otf",
      );
      let subset = f.createSubset();
      let iterable = f.glyphsForString("갈휸");
      for (let i = 0; i < iterable.length; i++) {
        let glyph = iterable[i];
        subset.includeGlyph(glyph);
      }

      const buf = await encodeSubset(subset);
      let subsetFont = fontkit.create(buf);
      let cffEntry = subsetFont.directory.tables["CFF "];
      if (!cffEntry) {
        throw new Error("Subset font is missing a CFF table");
      }

      let cffBuffer = buf.subarray(
        cffEntry.offset,
        cffEntry.offset + cffEntry.length,
      );

      let cff = new CFFFont(new r.DecodeStream(cffBuffer));
      expect(subsetFont.getGlyph(1).path.toSVG()).toBe(
        f.glyphsForString("갈")[0].path.toSVG(),
      );
      expect(cff.topDict.FDArray.length).toBe(2);
      expect(cff.topDict.FDSelect.fds).toEqual([0, 1, 1]);
    });
  });
});
