import fontkit from "@chr33s/pdf-fontkit";
import { FontNames } from "@chr33s/pdf-standard-fonts";
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, test } from "vitest";

import type { Fontkit } from "@chr33s/pdf-fontkit";
import { CustomFontEmbedder, StandardFontEmbedder } from "../../src/core/index.js";
import { breakTextIntoLines } from "../../src/utils/index.js";

const fk = fontkit as unknown as Fontkit;

let font: StandardFontEmbedder;

const textSize = 24;

const computeTextWidth = (text: string) => font.widthOfTextAtSize(text, textSize);

beforeAll(async () => {
  font = await StandardFontEmbedder.for(FontNames.Helvetica);
});

describe("breakTextIntoLines", () => {
  test("handles empty wordBreaks arrays", async () => {
    const input = "foobar-quxbaz";
    const expected = ["foobar-quxbaz"];
    const actual = await breakTextIntoLines(input, [], 21, computeTextWidth);
    expect(actual).toEqual(expected);
  });

  test("handles trailing newlines", async () => {
    const input = "foo\n";
    const expected = ["foo"];
    const actual = await breakTextIntoLines(input, [], 21, computeTextWidth);
    expect(actual).toEqual(expected);
  });

  test("handles trailing carriage returns", async () => {
    const input = "foo\r";
    const expected = ["foo"];
    const actual = await breakTextIntoLines(input, [], 21, computeTextWidth);
    expect(actual).toEqual(expected);
  });

  test("always breaks lines when EOLs are encountered", async () => {
    const input = "foo\nbar-qux\rbaz\n";
    const expected = ["foo", "bar-qux", "baz"];
    const actual = await breakTextIntoLines(input, [], 90000, computeTextWidth);
    expect(actual).toEqual(expected);
  });

  test("breaks at the last possible 'wordBreak' before exceeding 'maxWidth' (1)", async () => {
    const input = "Lorem Test ipsum dolor sit amet, consectetur adipiscing\nelit";
    const expected = [
      "Lorem T",
      "est ipsu",
      "m dolor s",
      "it amet, c",
      "onsectet",
      "ur adipis",
      "cing",
      "elit",
    ];
    const actual = await breakTextIntoLines(input, ["", "Test"], 100, computeTextWidth);
    expect(actual).toEqual(expected);
  });

  test("breaks at the last possible 'wordBreak' before exceeding 'maxWidth' (2)", async () => {
    const input = "Foo%bar%baz";
    const expected = ["Foo%", "bar%baz"];
    const actual = await breakTextIntoLines(input, ["%"], 100, computeTextWidth);
    expect(actual).toEqual(expected);
  });

  test("handles non-ascii code points and empty breaks", async () => {
    const sourceHansBytes = await readFile(
      "assets/fonts/source-hans-jp/source-han-serif-jp-regular.otf",
    );
    const sourceHansFont = await CustomFontEmbedder.for(fk, sourceHansBytes);

    const input = "遅未亮惑職界転藤柔索名午納，問通桑転加料演載満経信回込町者訟窃。";
    const expected = [
      "遅未亮惑職",
      "界転藤柔索",
      "名午納，問",
      "通桑転加料",
      "演載満経信",
      "回込町者訟",
      "窃。",
    ];
    const actual = await breakTextIntoLines(input, [""], 125, (text: string) =>
      sourceHansFont.widthOfTextAtSize(text, 24),
    );
    expect(actual).toEqual(expected);
  });
});
