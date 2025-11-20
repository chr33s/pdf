import assert from "assert";
import { describe, it } from "vitest";
import unicode from "../src/index.js";

const code = (char: string) => char.charCodeAt(0);

describe("unicode-properties", () => {
  it("getCategory", () => {
    assert.equal(unicode.getCategory(code("2")), "Nd");
    assert.equal(unicode.getCategory(code("x")), "Ll");
  });

  it("getCombiningClass", () => {
    assert.equal(unicode.getCombiningClass(code("x")), "Not_Reordered");
    assert.equal(unicode.getCombiningClass(code("́")), "Above");
    assert.equal(unicode.getCombiningClass(code("ٕ")), "Below");
    assert.equal(unicode.getCombiningClass(code("ٔ")), "Above");
  });

  it("getScript", () => {
    assert.equal(unicode.getScript(code("x")), "Latin");
    assert.equal(unicode.getScript(code("غ")), "Arabic");
  });

  it("getEastAsianWidth", () => {
    assert.equal(unicode.getEastAsianWidth(code("x")), "Na");
    assert.equal(unicode.getEastAsianWidth(code("杜")), "W");
    assert.equal(unicode.getEastAsianWidth(code("Æ")), "A");
  });

  it("getNumericValue", () => {
    assert.equal(unicode.getNumericValue(code("2")), 2);
    assert.equal(unicode.getNumericValue(code("x")), null);
  });

  it("isAlphabetic", () => {
    assert(unicode.isAlphabetic(code("x")));
    assert(!unicode.isAlphabetic(code("2")));
  });

  it("isDigit", () => {
    assert(!unicode.isDigit(code("x")));
    assert(unicode.isDigit(code("2")));
  });

  it("isPunctuation", () => {
    assert(!unicode.isPunctuation(code("x")));
    assert(unicode.isPunctuation(code(".")));
  });

  it("isLowerCase", () => {
    assert(!unicode.isLowerCase(code("X")));
    assert(!unicode.isLowerCase(code("2")));
    assert(unicode.isLowerCase(code("x")));
  });

  it("isUpperCase", () => {
    assert(unicode.isUpperCase(code("X")));
    assert(!unicode.isUpperCase(code("2")));
    assert(!unicode.isUpperCase(code("x")));
  });

  it("isTitleCase", () => {
    assert(unicode.isTitleCase(code("ǲ")));
    assert(!unicode.isTitleCase(code("2")));
    assert(!unicode.isTitleCase(code("x")));
  });

  it("isWhiteSpace", () => {
    assert(unicode.isWhiteSpace(code(" ")));
    assert(!unicode.isWhiteSpace(code("2")));
    assert(!unicode.isWhiteSpace(code("x")));
  });

  it("isBaseForm", () => {
    assert(unicode.isBaseForm(code("2")));
    assert(unicode.isBaseForm(code("x")));
    assert(!unicode.isBaseForm(code("́")));
  });

  it("isMark", () => {
    assert(!unicode.isMark(code("2")));
    assert(!unicode.isMark(code("x")));
    assert(unicode.isMark(code("́")));
  });
});
