import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

import fontkit from "./add-test-helpers-to-fontkit.js";
import { here } from "./utils/dir.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = here(import.meta.url);

describe("fontkit", function () {
  test("should open a font asynchronously", () =>
    fontkit.open(__dirname + "/data/open-sans/open-sans-regular.ttf", function (err, font) {
      expect(err).toBeNull();
      return expect(font?.constructor.name).toBe("TTFFont");
    }));

  test("should open a font synchronously", function () {
    let font = fontkit.openSync(__dirname + "/data/open-sans/open-sans-regular.ttf");
    return expect(font.constructor.name).toBe("TTFFont");
  });

  test("should open fonts of different formats", function () {
    let font = fontkit.openSync(__dirname + "/data/open-sans/open-sans-regular.ttf");
    expect(font.constructor.name).toBe("TTFFont");

    font = fontkit.openSync(__dirname + "/data/source-sans-pro/source-sans-pro-regular.otf");
    expect(font.constructor.name).toBe("TTFFont");

    font = fontkit.openSync(__dirname + "/data/noto-sans/noto-sans.ttc");
    expect(font.constructor.name).toBe("TrueTypeCollection");

    font = fontkit.openSync(__dirname + "/data/noto-sans/noto-sans.ttc", "NotoSans");
    expect(font.constructor.name).toBe("TTFFont");

    font = fontkit.openSync(__dirname + "/data/noto-sans/noto-sans.dfont");
    expect(font.constructor.name).toBe("DFont");

    font = fontkit.openSync(__dirname + "/data/noto-sans/noto-sans.dfont", "NotoSans");
    expect(font.constructor.name).toBe("TTFFont");

    font = fontkit.openSync(__dirname + "/data/source-sans-pro/source-sans-pro-regular.woff");
    expect(font.constructor.name).toBe("WOFFFont");

    font = fontkit.openSync(__dirname + "/data/source-sans-pro/source-sans-pro-regular.woff2");
    expect(font.constructor.name).toBe("WOFF2Font");
  });

  test("should open fonts lacking PostScript name", function () {
    let font = fontkit.openSync(__dirname + "/data/mada/mada-regular.subset1.ttf");
    expect(font.postscriptName).toBeNull();
  });

  test("should error when opening an invalid font asynchronously", function () {
    fontkit.open(__filename, function (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err?.message).toBe("Unknown font format");
    });
  });

  test("should error when opening an invalid font synchronously", function () {
    expect(() => fontkit.openSync(__filename)).toThrow(/Unknown font format/);
  });

  test("should get collection objects for ttc fonts", function () {
    let collection = fontkit.openSync(__dirname + "/data/noto-sans/noto-sans.ttc");
    expect(collection.constructor.name).toBe("TrueTypeCollection");

    if (!collection.fonts) {
      throw new Error("Expected font collection to expose fonts");
    }

    let names = collection.fonts.map((f: any) => f.postscriptName);
    expect(names).toEqual(["NotoSans-Bold", "NotoSans", "NotoSans-Italic", "NotoSans-BoldItalic"]);

    let font = collection.getFont("NotoSans-Italic");
    if (!font) {
      throw new Error("Expected collection to include requested font");
    }

    return expect(font.postscriptName).toBe("NotoSans-Italic");
  });

  test("should get collection objects for dfonts", function () {
    let collection = fontkit.openSync(__dirname + "/data/noto-sans/noto-sans.dfont");
    expect(collection.constructor.name).toBe("DFont");

    if (!collection.fonts) {
      throw new Error("Expected font collection to expose fonts");
    }

    let names = collection.fonts.map((f: any) => f.postscriptName);
    expect(names).toEqual(["NotoSans", "NotoSans-Bold", "NotoSans-Italic", "NotoSans-BoldItalic"]);

    let font = collection.getFont("NotoSans-Italic");
    if (!font) {
      throw new Error("Expected collection to include requested font");
    }

    return expect(font.postscriptName).toBe("NotoSans-Italic");
  });
});
