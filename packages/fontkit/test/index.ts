import assert from "node:assert";
import { fileURLToPath } from "node:url";
import { describe, test } from "vitest";

import fontkit from "./add-test-helpers-to-fontkit.js";
import { here } from "./utils/dir.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = here(import.meta.url);

describe("fontkit", function () {
  test("should open a font asynchronously", () =>
    fontkit.open(
      __dirname + "/data/open-sans/open-sans-regular.ttf",
      function (err, font) {
        assert.equal(err, null);
        return assert.equal(font.constructor.name, "TTFFont");
      },
    ));

  test("should open a font synchronously", function () {
    let font = fontkit.openSync(
      __dirname + "/data/open-sans/open-sans-regular.ttf",
    );
    return assert.equal(font.constructor.name, "TTFFont");
  });

  test("should open fonts of different formats", function () {
    let font = fontkit.openSync(
      __dirname + "/data/open-sans/open-sans-regular.ttf",
    );
    assert.equal(font.constructor.name, "TTFFont");

    font = fontkit.openSync(
      __dirname + "/data/source-sans-pro/source-sans-pro-regular.otf",
    );
    assert.equal(font.constructor.name, "TTFFont");

    font = fontkit.openSync(__dirname + "/data/noto-sans/noto-sans.ttc");
    assert.equal(font.constructor.name, "TrueTypeCollection");

    font = fontkit.openSync(
      __dirname + "/data/noto-sans/noto-sans.ttc",
      "NotoSans",
    );
    assert.equal(font.constructor.name, "TTFFont");

    font = fontkit.openSync(__dirname + "/data/noto-sans/noto-sans.dfont");
    assert.equal(font.constructor.name, "DFont");

    font = fontkit.openSync(
      __dirname + "/data/noto-sans/noto-sans.dfont",
      "NotoSans",
    );
    assert.equal(font.constructor.name, "TTFFont");

    font = fontkit.openSync(
      __dirname + "/data/source-sans-pro/source-sans-pro-regular.woff",
    );
    assert.equal(font.constructor.name, "WOFFFont");

    font = fontkit.openSync(
      __dirname + "/data/source-sans-pro/source-sans-pro-regular.woff2",
    );
    assert.equal(font.constructor.name, "WOFF2Font");
  });

  test("should open fonts lacking PostScript name", function () {
    let font = fontkit.openSync(
      __dirname + "/data/mada/mada-regular.subset1.ttf",
    );
    assert.equal(font.postscriptName, null);
  });

  test("should error when opening an invalid font asynchronously", function () {
    fontkit.open(__filename, function (err) {
      assert(err instanceof Error);
      assert.equal(err.message, "Unknown font format");
    });
  });

  test("should error when opening an invalid font synchronously", function () {
    assert.throws(() => fontkit.openSync(__filename), /Unknown font format/);
  });

  test("should get collection objects for ttc fonts", function () {
    let collection = fontkit.openSync(
      __dirname + "/data/noto-sans/noto-sans.ttc",
    );
    assert.equal(collection.constructor.name, "TrueTypeCollection");

    let names = collection.fonts.map((f: any) => f.postscriptName);
    assert.deepEqual(names, [
      "NotoSans-Bold",
      "NotoSans",
      "NotoSans-Italic",
      "NotoSans-BoldItalic",
    ]);

    let font = collection.getFont("NotoSans-Italic");
    return assert.equal(font.postscriptName, "NotoSans-Italic");
  });

  test("should get collection objects for dfonts", function () {
    let collection = fontkit.openSync(
      __dirname + "/data/noto-sans/noto-sans.dfont",
    );
    assert.equal(collection.constructor.name, "DFont");

    let names = collection.fonts.map((f: any) => f.postscriptName);
    assert.deepEqual(names, [
      "NotoSans",
      "NotoSans-Bold",
      "NotoSans-Italic",
      "NotoSans-BoldItalic",
    ]);

    let font = collection.getFont("NotoSans-Italic");
    return assert.equal(font.postscriptName, "NotoSans-Italic");
  });
});
