import fontkit from "@chr33s/fontkit";
import fs from "node:fs";
import { describe, expect, test } from "vitest";
import type { Font, Glyph } from "../../../src/types/fontkit.js";

import { createCmap } from "../../../src/core/embedders/c-map.js";
import { byAscendingId, sortedUniq } from "../../../src/utils/index.js";

const ubuntuFont = fs.readFileSync(
  new URL("../../../assets/fonts/ubuntu/ubuntu-r.ttf", import.meta.url),
);
const sourceHansJpFont = fs.readFileSync(
  new URL(
    "../../../assets/fonts/source-hans-jp/source-han-serif-jp-regular.otf",
    import.meta.url,
  ),
);

const ubuntuFontCmap = fs.readFileSync(
  new URL("./data/ubuntu-R.ttf.cmap", import.meta.url),
);
const sourceHansJpFontCmap = fs.readFileSync(
  new URL("./data/source-han-serif-jp-regular.otf.cmap", import.meta.url),
);

const allGlyphsInFontSortedById = (font: Font) => {
  const glyphs: Glyph[] = [];
  for (let idx = 0, len = font.characterSet.length; idx < len; idx++) {
    const codePoint = font.characterSet[idx];
    glyphs.push(font.glyphForCodePoint(codePoint));
  }
  return sortedUniq(glyphs.sort(byAscendingId), (g) => g.id);
};

describe("createCmap", () => {
  test("creates CMaps for embedded ubuntu-R font files", () => {
    const font = fontkit.create(ubuntuFont);

    const glyphs = allGlyphsInFontSortedById(font);
    const cmap = createCmap(glyphs, (g) => (g ? g.id : -1));

    expect(cmap).toEqual(String(ubuntuFontCmap));
  });

  test("creates CMaps for embedded source-han-serif-jp-regular font files", () => {
    const font = fontkit.create(sourceHansJpFont);

    const glyphs = allGlyphsInFontSortedById(font);
    const cmap = createCmap(glyphs, (g) => (g ? g.id : -1));

    expect(cmap).toEqual(String(sourceHansJpFontCmap));
  });
});
