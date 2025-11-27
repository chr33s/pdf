import { beforeAll, describe, expect, test } from "vitest";

import fontkit from "./add-test-helpers-to-fontkit.js";
import { here } from "./utils/dir.js";

const __dirname = here(import.meta.url);
const xAdvances = (positions: Array<{ xAdvance: number }> | null) => {
  if (!positions) {
    throw new Error("Expected layout positions to be available");
  }

  return positions.map((position) => position.xAdvance);
};

describe("glyph positioning", function () {
  describe("basic positioning", function () {
    let font: Awaited<ReturnType<typeof fontkit.open>>;

    beforeAll(async () => {
      font = await fontkit.open(__dirname + "/data/source-sans-pro/source-sans-pro-regular.otf");
    });

    test("should get a glyph width", () => expect(font.getGlyph(5).advanceWidth).toBe(615));
  });

  describe("opentype positioning", function () {
    let font: Awaited<ReturnType<typeof fontkit.open>>;

    beforeAll(async () => {
      font = await fontkit.open(__dirname + "/data/source-sans-pro/source-sans-pro-regular.otf");
    });

    test("should apply opentype GPOS features", function () {
      let { positions } = font.layout("Twitter");
      return expect(xAdvances(positions)).toEqual([502, 718, 246, 318, 324, 496, 347]);
    });

    test("should ignore duplicate features", function () {
      let { positions } = font.layout("Twitter", ["kern", "kern"]);
      return expect(xAdvances(positions)).toEqual([502, 718, 246, 318, 324, 496, 347]);
    });
  });

  describe("AAT features", function () {
    let font: Awaited<ReturnType<typeof fontkit.open>>;

    beforeAll(async () => {
      font = await fontkit.open(__dirname + "/data/play/play-regular.ttf");
    });

    test("should apply kerning by default", function () {
      let { positions } = font.layout("Twitter");
      return expect(xAdvances(positions)).toEqual([535, 792, 246, 372, 402, 535, 351]);
    });
  });
});
