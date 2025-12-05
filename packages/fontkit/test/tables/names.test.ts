import { describe, expect, test } from "vitest";

import fontkit, { here } from "../helpers.js";

const __dirname = here(import.meta.url);

describe("nametable", async function () {
  let font = await fontkit.open(__dirname + "/../data/mada/mada-vf.ttf");
  let name: any = font["name"];

  test("name table exists", function () {
    expect("name" in font).toBe(true);
  });

  test("check name table ID 0: copyright", function () {
    expect(name.records.copyright.en).toBe(
      'Copyright © 2015-2017 The Mada Project Authors, with Reserved Font Name "Source". Source is a trademark of Adobe Systems Incorporated in the United States and/or other countries.',
    );
  });

  test("check name table ID 1: fontFamily", function () {
    expect(name.records.fontFamily.en).toBe("Mada Medium");
  });

  test("check name table ID 2: fontSubfamily", function () {
    expect(name.records.fontSubfamily.en).toBe("Regular");
  });

  test("check name table ID 3: uniqueSubfamily", function () {
    expect(name.records.uniqueSubfamily.en).toBe("Version 1.004;ALIF;Mada Medium Regular");
  });

  test("check name table ID 4: fullName", function () {
    expect(name.records.fullName.en).toBe("Mada Medium");
  });

  test("check name table ID 5: version", function () {
    expect(name.records.version.en).toBe("Version 1.004");
  });

  test("check name table ID 6: postscriptName", function () {
    expect(name.records.postscriptName.en).toBe("Mada-Medium");
  });

  const expected7 = "This is a trademark.";
  name.records.trademark = { en: expected7 };
  test("check name table ID 7: trademark", function () {
    expect(name.records.trademark.en).toBe(expected7);
  });

  const expected8 = "This is a manufacturer.";
  name.records.manufacturer = { en: expected8 };
  test("check name table ID 8: manufacturer", function () {
    expect(name.records.manufacturer.en).toBe(expected8);
  });

  test("check name table ID 9: designer", function () {
    expect(name.records.designer.en).toBe("Khaled Hosny");
  });

  test("check name table ID 10: description", function () {
    expect(name.records.description.en).toBe(
      "Mada is a geometric, unmodulted Arabic display typeface inspired by Cairo road signage.",
    );
  });

  const expected11 = "This is a vendorURL.";
  name.records.vendorURL = { en: expected11 };
  test("check name table ID 11: vendorURL", function () {
    expect(name.records.vendorURL.en).toBe(expected11);
  });

  const expected12 = "This is a designerURL.";
  name.records.designerURL = { en: expected12 };
  test("check name table ID 12: designerURL", function () {
    expect(name.records.designerURL.en).toBe(expected12);
  });

  test("check name table ID 13: license", function () {
    expect(name.records.license.en).toBe(
      "This Font Software is licensed under the SIL Open Font License, Version 1.1. This license is available with a FAQ at: http://scripts.sil.org/OFL",
    );
  });

  test("check name table ID 14: licenseURL", function () {
    expect(name.records.licenseURL.en).toBe("http://scripts.sil.org/OFL");
  });

  test("check name table ID 16: preferredFamily", function () {
    expect(name.records.preferredFamily.en).toBe("Mada");
  });

  test("check name table ID 17: preferredSubfamily", function () {
    expect(name.records.preferredSubfamily.en).toBe("Medium");
  });

  const expected18 = "This is a compatibleFull.";
  name.records.compatibleFull = { en: expected18 };
  test("check name table ID 18: compatibleFull", function () {
    expect(name.records.compatibleFull.en).toBe(expected18);
  });

  const expected19 = "This is a sampleText.";
  name.records.sampleText = { en: expected19 };
  test("check name table ID 19: sampleText", function () {
    expect(name.records.sampleText.en).toBe(expected19);
  });

  const expected20 = "This is a postscriptCIDFontName.";
  name.records.postscriptCIDFontName = { en: expected20 };
  test("check name table ID 20: postscriptCIDFontName", function () {
    expect(name.records.postscriptCIDFontName.en).toBe(expected20);
  });

  const expected21 = "This is a wwsFamilyName.";
  name.records.wwsFamilyName = { en: expected21 };
  test("check name table ID 21: wwsFamilyName", function () {
    expect(name.records.wwsFamilyName.en).toBe(expected21);
  });

  const expected22 = "This is a wwsSubfamilyName.";
  name.records.wwsSubfamilyName = { en: expected22 };
  test("check name table ID 22: wwsSubfamilyName", function () {
    expect(name.records.wwsSubfamilyName.en).toBe(expected22);
  });

  const expected23 = "This is a lightBackgroundPalette.";
  name.records.lightBackgroundPalette = { en: expected23 };
  test("check name table ID 23: lightBackgroundPalette", function () {
    expect(name.records.lightBackgroundPalette.en).toBe(expected23);
  });

  const expected24 = "This is a darkBackgroundPalette.";
  name.records.darkBackgroundPalette = { en: expected24 };
  test("check name table ID 24: darkBackgroundPalette", function () {
    expect(name.records.darkBackgroundPalette.en).toBe(expected24);
  });

  const expected25 = "This is a variationsPostScriptName.";
  name.records.variationsPostScriptName = { en: expected25 };
  test("check name table ID 25: variationsPostScriptName", function () {
    expect(name.records.variationsPostScriptName.en).toBe(expected25);
  });
});
