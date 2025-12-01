import fontkit from "@chr33s/fontkit";
import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";

import type { Font, Glyph } from "@chr33s/fontkit";
import { createCmap } from "../../../src/core/embedders/c-map.js";
import { byAscendingId, sortedUniq } from "../../../src/utils/index.js";

const ubuntuFont = await readFile(
  new URL("../../../assets/fonts/ubuntu/ubuntu-r.ttf", import.meta.url),
);
const sourceHansJpFont = await readFile(
  new URL("../../../assets/fonts/source-hans-jp/source-han-serif-jp-regular.otf", import.meta.url),
);

const ubuntuFontCmap = await readFile(new URL("./data/ubuntu-R.ttf.cmap", import.meta.url));
const sourceHansJpFontCmap = await readFile(
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
  test("creates CMaps for embedded ubuntu-R font files", async () => {
    const font = (await fontkit.create(ubuntuFont)) as unknown as Font;

    const glyphs = allGlyphsInFontSortedById(font);
    const cmap = createCmap(glyphs, (g) => (g ? g.id : -1));

    expect(cmap).toEqual(String(ubuntuFontCmap));
  });

  test("creates CMaps for embedded source-han-serif-jp-regular font files", async () => {
    const font = (await fontkit.create(sourceHansJpFont)) as unknown as Font;

    const glyphs = allGlyphsInFontSortedById(font);
    const cmap = createCmap(glyphs, (g) => (g ? g.id : -1));

    expect(cmap).toEqual(String(sourceHansJpFontCmap));
  });
});
