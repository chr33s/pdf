import { access } from "node:fs/promises";
import { beforeAll, describe, expect, test } from "vitest";

import * as r from "@chr33s/pdf-restructure";
import CFFFont from "../src/cff/cff-font.js";
import fontkit, { here } from "./helpers.js";

const __dirname = here(import.meta.url);
const SKIA_FONT_PATH = "/Library/Fonts/Skia.ttf";
const hasSkiaFont = await access(SKIA_FONT_PATH)
  .then(() => true)
  .catch(() => false);

describe("font subsetting", function () {
  describe("truetype subsetting", function () {
    let font: Awaited<ReturnType<typeof fontkit.open>>;

    beforeAll(async () => {
      font = await fontkit.open(__dirname + "/data/open-sans/open-sans-regular.ttf");
    });

    test("should create a TTFSubset instance", function () {
      let subset = font.createSubset();
      expect(subset.constructor.name).toBe("TTFSubset");
    });

    test("should produce a subset", async function () {
      let subset = font.createSubset();
      for (let glyph of font.glyphsForString("hello")) {
        subset.includeGlyph(glyph);
      }

      const buf = await subset.encodeBuffer();
      let f = await fontkit.create(buf);
      expect(f.numGlyphs).toBe(5);
      expect((await f.getGlyph(1).getPath()).toSVG()).toBe(
        (await font.glyphsForString("h")[0].getPath()).toSVG(),
      );
    });

    test.runIf(hasSkiaFont)("should re-encode variation glyphs", async function () {
      let font = await fontkit.open(SKIA_FONT_PATH, "Bold");
      let subset = font.createSubset();
      for (let glyph of font.glyphsForString("e")) {
        subset.includeGlyph(glyph);
      }

      const buf = await subset.encodeBuffer();
      let f = await fontkit.create(buf);
      expect((await f.getGlyph(1).getPath()).toSVG()).toBe(
        (await font.glyphsForString("e")[0].getPath()).toSVG(),
      );
    });

    test("should handle composite glyphs", async function () {
      let subset = font.createSubset();
      subset.includeGlyph(font.glyphsForString("é")[0]);

      const buf = await subset.encodeBuffer();
      let f = await fontkit.create(buf);
      expect(f.numGlyphs).toBe(4);
      expect((await f.getGlyph(1).getPath()).toSVG()).toBe(
        (await font.glyphsForString("é")[0].getPath()).toSVG(),
      );
    });

    test("should produce a subset including font table OS/2", async function () {
      let subset = font.createSubset();
      for (let glyph of font.glyphsForString("hello")) {
        subset.includeGlyph(glyph);
      }
      subset.includeTable("OS/2");

      const buf = await subset.encodeBuffer();
      let f = await fontkit.create(buf);
      expect("OS/2" in f).toBe(true);
    });
  });

  describe("CFF subsetting", function () {
    let font: Awaited<ReturnType<typeof fontkit.open>>;

    beforeAll(async () => {
      font = await fontkit.open(__dirname + "/data/source-sans-pro/source-sans-pro-regular.otf");
    });

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

      const buf = await subset.encodeBuffer();
      let subsetFont = await fontkit.create(buf);
      expect((await subsetFont.getGlyph(1).getPath()).toSVG()).toBe(
        (await font.glyphsForString("h")[0].getPath()).toSVG(),
      );
    });

    test("should handle CID fonts", async function () {
      let f = await fontkit.open(__dirname + "/data/noto-sans-cjk/noto-sans-cj-kkr-regular.otf");
      let subset = f.createSubset();
      let iterable = f.glyphsForString("갈휴");
      for (let i = 0; i < iterable.length; i++) {
        let glyph = iterable[i];
        subset.includeGlyph(glyph);
      }

      const buf = await subset.encodeBuffer();
      let subsetFont = await fontkit.create(buf);
      let cffEntry = subsetFont.directory.tables["CFF "];
      if (!cffEntry) {
        throw new Error("Subset font is missing a CFF table");
      }

      let cffBuffer = buf.subarray(cffEntry.offset, cffEntry.offset + cffEntry.length);

      let cff = new CFFFont(new r.DecodeStream(cffBuffer));
      expect((await subsetFont.getGlyph(1).getPath()).toSVG()).toBe(
        (await f.glyphsForString("갈")[0].getPath()).toSVG(),
      );
      expect(cff.topDict.FDArray.length).toBe(2);
      expect(cff.topDict.FDSelect.fds).toEqual([0, 1, 1]);
    });
  });
});
