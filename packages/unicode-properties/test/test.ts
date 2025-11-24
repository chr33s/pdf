import assert from "node:assert";
import { describe, test } from "vitest";
import unicode from "../src/index.js";

const code = (char: string) => char.charCodeAt(0);

describe("unicode-properties", () => {
  test("getCategory", () => {
    assert.equal(unicode.getCategory(code("2")), "Nd");
    assert.equal(unicode.getCategory(code("x")), "Ll");
  });

  test("getCombiningClass", () => {
    assert.equal(unicode.getCombiningClass(code("x")), "Not_Reordered");
    assert.equal(unicode.getCombiningClass(code("́")), "Above");
    assert.equal(unicode.getCombiningClass(code("ٕ")), "Below");
    assert.equal(unicode.getCombiningClass(code("ٔ")), "Above");
  });

  test("getScript", () => {
    assert.equal(unicode.getScript(code("x")), "Latin");
    assert.equal(unicode.getScript(code("غ")), "Arabic");
  });

  test("getEastAsianWidth", () => {
    assert.equal(unicode.getEastAsianWidth(code("x")), "Na");
    assert.equal(unicode.getEastAsianWidth(code("杜")), "W");
    assert.equal(unicode.getEastAsianWidth(code("Æ")), "A");
  });

  test("getNumericValue", () => {
    assert.equal(unicode.getNumericValue(code("2")), 2);
    assert.equal(unicode.getNumericValue(code("x")), null);
  });

  test("isAlphabetic", () => {
    assert(unicode.isAlphabetic(code("x")));
    assert(!unicode.isAlphabetic(code("2")));
  });

  test("isDigit", () => {
    assert(!unicode.isDigit(code("x")));
    assert(unicode.isDigit(code("2")));
  });

  test("isPunctuation", () => {
    assert(!unicode.isPunctuation(code("x")));
    assert(unicode.isPunctuation(code(".")));
  });

  test("isLowerCase", () => {
    assert(!unicode.isLowerCase(code("X")));
    assert(!unicode.isLowerCase(code("2")));
    assert(unicode.isLowerCase(code("x")));
  });

  test("isUpperCase", () => {
    assert(unicode.isUpperCase(code("X")));
    assert(!unicode.isUpperCase(code("2")));
    assert(!unicode.isUpperCase(code("x")));
  });

  test("isTitleCase", () => {
    assert(unicode.isTitleCase(code("ǲ")));
    assert(!unicode.isTitleCase(code("2")));
    assert(!unicode.isTitleCase(code("x")));
  });

  test("isWhiteSpace", () => {
    assert(unicode.isWhiteSpace(code(" ")));
    assert(!unicode.isWhiteSpace(code("2")));
    assert(!unicode.isWhiteSpace(code("x")));
  });

  test("isBaseForm", () => {
    assert(unicode.isBaseForm(code("2")));
    assert(unicode.isBaseForm(code("x")));
    assert(!unicode.isBaseForm(code("́")));
  });

  test("isMark", () => {
    assert(!unicode.isMark(code("2")));
    assert(!unicode.isMark(code("x")));
    assert(unicode.isMark(code("́")));
  });
});
