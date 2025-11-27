import { beforeAll, describe, expect, test } from "vitest";
import createUnicodeProperties, { type UnicodePropertiesAPI } from "../src/index.js";

const code = (char: string) => char.charCodeAt(0);

describe("unicode-properties", () => {
  let unicode: UnicodePropertiesAPI;

  beforeAll(async () => {
    unicode = await createUnicodeProperties();
  });

  test("getCategory", () => {
    expect(unicode.getCategory(code("2"))).toBe("Nd");
    expect(unicode.getCategory(code("x"))).toBe("Ll");
  });

  test("getCombiningClass", () => {
    expect(unicode.getCombiningClass(code("x"))).toBe("Not_Reordered");
    expect(unicode.getCombiningClass(code("́"))).toBe("Above");
    expect(unicode.getCombiningClass(code("ٕ"))).toBe("Below");
    expect(unicode.getCombiningClass(code("ٔ"))).toBe("Above");
  });

  test("getScript", () => {
    expect(unicode.getScript(code("x"))).toBe("Latin");
    expect(unicode.getScript(code("غ"))).toBe("Arabic");
  });

  test("getEastAsianWidth", () => {
    expect(unicode.getEastAsianWidth(code("x"))).toBe("Na");
    expect(unicode.getEastAsianWidth(code("杜"))).toBe("W");
    expect(unicode.getEastAsianWidth(code("Æ"))).toBe("A");
  });

  test("getNumericValue", () => {
    expect(unicode.getNumericValue(code("2"))).toBe(2);
    expect(unicode.getNumericValue(code("x"))).toBeNull();
  });

  test("isAlphabetic", () => {
    expect(unicode.isAlphabetic(code("x"))).toBe(true);
    expect(unicode.isAlphabetic(code("2"))).toBe(false);
  });

  test("isDigit", () => {
    expect(unicode.isDigit(code("x"))).toBe(false);
    expect(unicode.isDigit(code("2"))).toBe(true);
  });

  test("isPunctuation", () => {
    expect(unicode.isPunctuation(code("x"))).toBe(false);
    expect(unicode.isPunctuation(code("."))).toBe(true);
  });

  test("isLowerCase", () => {
    expect(unicode.isLowerCase(code("X"))).toBe(false);
    expect(unicode.isLowerCase(code("2"))).toBe(false);
    expect(unicode.isLowerCase(code("x"))).toBe(true);
  });

  test("isUpperCase", () => {
    expect(unicode.isUpperCase(code("X"))).toBe(true);
    expect(unicode.isUpperCase(code("2"))).toBe(false);
    expect(unicode.isUpperCase(code("x"))).toBe(false);
  });

  test("isTitleCase", () => {
    expect(unicode.isTitleCase(code("ǲ"))).toBe(true);
    expect(unicode.isTitleCase(code("2"))).toBe(false);
    expect(unicode.isTitleCase(code("x"))).toBe(false);
  });

  test("isWhiteSpace", () => {
    expect(unicode.isWhiteSpace(code(" "))).toBe(true);
    expect(unicode.isWhiteSpace(code("2"))).toBe(false);
    expect(unicode.isWhiteSpace(code("x"))).toBe(false);
  });

  test("isBaseForm", () => {
    expect(unicode.isBaseForm(code("2"))).toBe(true);
    expect(unicode.isBaseForm(code("x"))).toBe(true);
    expect(unicode.isBaseForm(code("́"))).toBe(false);
  });

  test("isMark", () => {
    expect(unicode.isMark(code("2"))).toBe(false);
    expect(unicode.isMark(code("x"))).toBe(false);
    expect(unicode.isMark(code("́"))).toBe(true);
  });
});
