import fontkit from "@chr33s/fontkit";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import type { Font, Glyph } from "../../../src/types/fontkit.js";

import { createCmap } from "../../../src/core/embedders/CMap.js";
import { byAscendingId, sortedUniq } from "../../../src/utils/index.js";

const ubuntuFont = fs.readFileSync(
  new URL("../../../assets/fonts/ubuntu/Ubuntu-R.ttf", import.meta.url),
);
const sourceHansJpFont = fs.readFileSync(
  new URL(
    "../../../assets/fonts/source_hans_jp/SourceHanSerifJP-Regular.otf",
    import.meta.url,
  ),
);

const ubuntuFontCmap = fs.readFileSync(
  new URL("./data/Ubuntu-R.ttf.cmap", import.meta.url),
);
const sourceHansJpFontCmap = fs.readFileSync(
  new URL("./data/SourceHanSerifJP-Regular.otf.cmap", import.meta.url),
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
  it("creates CMaps for embedded Ubuntu-R font files", () => {
    const font = fontkit.create(ubuntuFont);

    const glyphs = allGlyphsInFontSortedById(font);
    const cmap = createCmap(glyphs, (g) => (g ? g.id : -1));

    expect(cmap).toEqual(String(ubuntuFontCmap));
  });

  it("creates CMaps for embedded SourceHanSerifJP-Regular font files", () => {
    const font = fontkit.create(sourceHansJpFont);

    const glyphs = allGlyphsInFontSortedById(font);
    const cmap = createCmap(glyphs, (g) => (g ? g.id : -1));

    expect(cmap).toEqual(String(sourceHansJpFontCmap));
  });
});
