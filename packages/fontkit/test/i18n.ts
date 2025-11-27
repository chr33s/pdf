import { afterAll, afterEach, beforeEach, describe, expect, test } from "vitest";

import fontkit, { type FontInstance } from "./add-test-helpers-to-fontkit.js";
import { here } from "./utils/dir.js";

const __dirname = here(import.meta.url);

describe("i18n", function () {
  describe("fontkit.setDefaultLanguage", function () {
    let font: FontInstance;
    beforeEach(async function () {
      font = await fontkit.open(__dirname + "/data/amiri/amiri-regular.ttf");
    });

    afterEach(function () {
      fontkit.setDefaultLanguage();
    });

    test('font has "en" metadata properties', function () {
      expect(font.fullName).toBe("Amiri");
      expect(font.postscriptName).toBe("Amiri-Regular");
      expect(font.familyName).toBe("Amiri");
      expect(font.subfamilyName).toBe("Regular");
      expect(font.copyright).toBe(
        "Copyright (c) 2010-2017, Khaled Hosny <khaledhosny@eglug.org>.\nPortions copyright (c) 2010, Sebastian Kosch <sebastian@aldusleaf.org>.",
      );
      expect(font.version).toBe("Version 000.110 ");
    });

    test('can set global default language to "ar"', function () {
      fontkit.setDefaultLanguage("ar");
      expect(fontkit.defaultLanguage).toBe("ar");
    });

    test('font now has "ar" metadata properties', function () {
      fontkit.setDefaultLanguage("ar");
      expect(font.fullName).toBe("Amiri");
      expect(font.postscriptName).toBe("Amiri-Regular");
      expect(font.familyName).toBe("Amiri");
      expect(font.subfamilyName).toBe("عادي");
      expect(font.copyright).toBe("حقوق النشر 2010-2017، خالد حسني <khaledhosny@eglug.org>.");
      expect(font.version).toBe("إصدارة 000٫110");
    });

    test('can reset default language back to "en"', function () {
      fontkit.setDefaultLanguage();
      expect(fontkit.defaultLanguage).toBe("en");
    });
  });

  describe("font.setDefaultLanguage", function () {
    let font: FontInstance;
    beforeEach(async function () {
      font = await fontkit.open(__dirname + "/data/amiri/amiri-regular.ttf");
    });

    test('font has "en" metadata properties', function () {
      expect(font.fullName).toBe("Amiri");
      expect(font.postscriptName).toBe("Amiri-Regular");
      expect(font.familyName).toBe("Amiri");
      expect(font.subfamilyName).toBe("Regular");
      expect(font.copyright).toBe(
        "Copyright (c) 2010-2017, Khaled Hosny <khaledhosny@eglug.org>.\nPortions copyright (c) 2010, Sebastian Kosch <sebastian@aldusleaf.org>.",
      );
      expect(font.version).toBe("Version 000.110 ");
    });

    test('can set font\'s default language to "ar"', function () {
      font.setDefaultLanguage("ar");
      expect(font.defaultLanguage).toBe("ar");
    });

    test('font now has "ar" metadata properties', function () {
      font.setDefaultLanguage("ar");
      expect(font.fullName).toBe("Amiri");
      expect(font.postscriptName).toBe("Amiri-Regular");
      expect(font.familyName).toBe("Amiri");
      expect(font.subfamilyName).toBe("عادي");
      expect(font.copyright).toBe("حقوق النشر 2010-2017، خالد حسني <khaledhosny@eglug.org>.");
      expect(font.version).toBe("إصدارة 000٫110");
    });

    test("the font's language should not change when the global changes", function () {
      font.setDefaultLanguage("ar");
      fontkit.setDefaultLanguage("en");

      expect(font.defaultLanguage).toBe("ar");
      expect(font.subfamilyName).toBe("عادي");
    });

    test('can reset default language back to "en"', function () {
      font.setDefaultLanguage();
      expect(font.defaultLanguage).toBe(null);
      expect(font.subfamilyName).toBe("Regular");
    });
  });

  describe("backup languages", function () {
    let font: FontInstance;
    beforeEach(async function () {
      font = await fontkit.open(__dirname + "/data/amiri/amiri-regular.ttf");
    });

    afterAll(function () {
      fontkit.setDefaultLanguage();
    });

    test("if the font's default language isn't found, use the global language", function () {
      font.setDefaultLanguage("piglatin");
      fontkit.setDefaultLanguage("ar");

      expect(font.subfamilyName).toBe("عادي");
    });
    test('if the global language isn\'t found, use "en"', function () {
      font.setDefaultLanguage("piglatin");
      fontkit.setDefaultLanguage("klingon");

      expect(font.subfamilyName).toBe("Regular");
    });
  });
});
