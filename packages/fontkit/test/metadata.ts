import { describe, expect, test } from "vitest";

import BBox from "../src/glyph/b-box.js";
import fontkit from "./add-test-helpers-to-fontkit.js";
import { here } from "./utils/dir.js";

const __dirname = here(import.meta.url);

describe("metadata", function () {
  let font = fontkit.openSync(__dirname + "/data/noto-sans/noto-sans.ttc", "NotoSans");

  test("has metadata properties", function () {
    expect(font.fullName).toBe("Noto Sans");
    expect(font.postscriptName).toBe("NotoSans");
    expect(font.familyName).toBe("Noto Sans");
    expect(font.subfamilyName).toBe("Regular");
    expect(font.copyright).toBe("Copyright 2012 Google Inc. All Rights Reserved.");
    return expect(font.version).toBe("Version 1.05 uh");
  });

  test("exposes some metrics", function () {
    expect(font.unitsPerEm).toBe(2048);
    expect(font.ascent | 0).toBe(2189);
    expect(font.descent | 0).toBe(-600);
    expect(font.lineGap).toBe(0);
    expect(font.underlinePosition).toBe(-154);
    expect(font.underlineThickness).toBe(102);
    expect(font.italicAngle).toBe(0);
    expect(font.capHeight).toBe(1462);
    expect(font.xHeight).toBe(1098);
    expect(font.numGlyphs).toBe(8708);
    return expect(font.bbox).toEqual(new BBox(-1268, -600, 2952, 2189));
  });

  test("exposes tables directly", function () {
    let iterable = ["head", "hhea", "OS/2", "post"];
    for (let i = 0; i < iterable.length; i++) {
      let table = iterable[i];
      expect(typeof font[table]).toBe("object");
    }
  });
});
