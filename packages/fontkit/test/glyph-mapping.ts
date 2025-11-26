import { describe, expect, test } from "vitest";

import fontkit from "./add-test-helpers-to-fontkit.js";
import { here } from "./utils/dir.js";

const __dirname = here(import.meta.url);
const glyphIds = (glyphs: Array<{ id: number }>) =>
  glyphs.map((glyph) => glyph.id);
const glyphCodePoints = (glyphs: Array<{ codePoints: number[] }>) =>
  glyphs.map((glyph) => glyph.codePoints);

describe("character to glyph mapping", function () {
  describe("basic cmap handling", function () {
    let font = fontkit.openSync(
      __dirname + "/data/open-sans/open-sans-regular.ttf",
    );

    test("should get characterSet", function () {
      expect(Array.isArray(font.characterSet)).toBe(true);
      return expect(font.characterSet.length).toBe(884);
    });

    test("should check if a character is supported", function () {
      expect(font.hasGlyphForCodePoint("a".charCodeAt(0))).toBe(true);
      return expect(font.hasGlyphForCodePoint(0)).toBe(false);
    });

    test("should get a glyph for a character code", function () {
      let glyph = font.glyphForCodePoint("a".charCodeAt(0));
      expect(glyph.id).toBe(68);
      return expect(glyph.codePoints).toEqual([97]);
    });

    test("should map a string to glyphs", function () {
      let glyphs = font.glyphsForString("hello");
      expect(Array.isArray(glyphs)).toBe(true);
      expect(glyphs.length).toBe(5);
      expect(glyphIds(glyphs)).toEqual([75, 72, 79, 79, 82]);
      return expect(glyphCodePoints(glyphs)).toEqual([
        [104],
        [101],
        [108],
        [108],
        [111],
      ]);
    });

    test("should support unicode variation selectors", function () {
      let font = fontkit.openSync(__dirname + "/data/fonttest/test-cmap14.otf");
      let glyphs = font.glyphsForString(
        "\u{82a6}\u{82a6}\u{E0100}\u{82a6}\u{E0101}",
      );
      expect(glyphIds(glyphs)).toEqual([1, 1, 2]);
    });

    test("should support legacy encodings when no unicode cmap is found", function () {
      let font = fontkit.openSync(
        __dirname + "/data/fonttest/test-cmap-mac-turkish.ttf",
      );
      let glyphs = font.glyphsForString("“ABÇĞIİÖŞÜ”");
      expect(glyphIds(glyphs)).toEqual([
        200, 34, 35, 126, 176, 42, 178, 140, 181, 145, 201,
      ]);
    });
  });

  describe("opentype features", function () {
    let font = fontkit.openSync(
      __dirname + "/data/source-sans-pro/source-sans-pro-regular.otf",
    );

    test("should list available features", () =>
      expect(font.availableFeatures).toEqual([
        "aalt",
        "c2sc",
        "case",
        "ccmp",
        "dnom",
        "frac",
        "liga",
        "numr",
        "onum",
        "ordn",
        "pnum",
        "salt",
        "sinf",
        "smcp",
        "ss01",
        "ss02",
        "ss03",
        "ss04",
        "ss05",
        "subs",
        "sups",
        "zero",
        "kern",
        "mark",
        "mkmk",
        "size",
      ]));

    test("should apply opentype GSUB features", function () {
      let { glyphs } = font.layout("ffi", ["dlig"]);
      expect(glyphs.length).toBe(2);
      expect(glyphIds(glyphs)).toEqual([514, 36]);
      return expect(glyphCodePoints(glyphs)).toEqual([[102, 102], [105]]);
    });

    test("should enable fractions when using fraction slash", function () {
      let { glyphs } = font.layout("123 1⁄16 123");
      return expect(glyphIds(glyphs)).toEqual([
        1088, 1089, 1090, 1, 1617, 1724, 1603, 1608, 1, 1088, 1089, 1090,
      ]);
    });

    test("should not break if can’t enable fractions when using fraction slash", function () {
      let { glyphs } = font.layout("a⁄b ⁄ 1⁄ ⁄2");
      return expect(glyphIds(glyphs)).toEqual([
        28, 1724, 29, 1, 1724, 1, 1617, 1724, 1, 1724, 1604,
      ]);
    });
  });

  describe("AAT features", function () {
    let font = fontkit.openSync(__dirname + "/data/play/play-regular.ttf");

    test("should list available features", () =>
      expect(font.availableFeatures).toEqual([
        "tnum",
        "sups",
        "subs",
        "numr",
        "onum",
        "lnum",
        "liga",
        "kern",
      ]));

    test("should apply default AAT morx features", function () {
      let { glyphs } = font.layout("ffi 1⁄2");
      expect(glyphs.length).toBe(5);
      expect(glyphIds(glyphs)).toEqual([767, 3, 20, 645, 21]);
      return expect(glyphCodePoints(glyphs)).toEqual([
        [102, 102, 105],
        [32],
        [49],
        [8260],
        [50],
      ]);
    });

    test("should apply user specified features", function () {
      let { glyphs } = font.layout("ffi 1⁄2", ["numr"]);
      expect(glyphs.length).toBe(3);
      expect(glyphIds(glyphs)).toEqual([767, 3, 126]);
      return expect(glyphCodePoints(glyphs)).toEqual([
        [102, 102, 105],
        [32],
        [49, 8260, 50],
      ]);
    });

    test("should handle rtl direction", function () {
      let { glyphs } = font.layout("ffi", [], null, null, "rtl");
      expect(glyphs.length).toBe(3);
      expect(glyphIds(glyphs)).toEqual([76, 73, 73]);
      return expect(glyphCodePoints(glyphs)).toEqual([[105], [102], [102]]);
    });

    test("should apply indic reordering features", function () {
      let f = fontkit.openSync(__dirname + "/data/khmer/khmer.ttf");
      let { glyphs } = f.layout("ខ្ញុំអាចញ៉ាំកញ្ចក់បាន ដោយគ្មានបញ្ហា");
      expect(glyphIds(glyphs)).toEqual([
        45, 153, 177, 112, 248, 188, 49, 296, 44, 187, 149, 44, 117, 236, 188,
        63, 3, 107, 226, 188, 69, 218, 169, 188, 63, 64, 255, 175, 188,
      ]);

      return expect(glyphCodePoints(glyphs)).toEqual([
        [6017],
        [6098, 6025],
        [6075],
        [6086],
        [6050],
        [6070],
        [6021],
        [6025, 6089, 6070, 6086],
        [6016],
        [6025],
        [6098, 6021],
        [6016],
        [6091],
        [6036],
        [6070],
        [6035],
        [32],
        [6084],
        [6026],
        [6070],
        [6041],
        [6018],
        [6098, 6040],
        [6070],
        [6035],
        [6036],
        [6025],
        [6098, 6048],
        [6070],
      ]);
    });
  });

  describe("glyph id to strings", function () {
    test("should return strings from cmap that map to a given glyph", function () {
      let font = fontkit.openSync(
        __dirname + "/data/open-sans/open-sans-regular.ttf",
      );
      let strings = font.stringsForGlyph(68);
      expect(strings).toEqual(["a"]);
    });

    test("should return strings from AAT morx table that map to the given glyph", function () {
      let font = fontkit.openSync(__dirname + "/data/play/play-regular.ttf");
      let strings = font.stringsForGlyph(767);
      expect(strings).toEqual(["ffi"]);
    });
  });
});
