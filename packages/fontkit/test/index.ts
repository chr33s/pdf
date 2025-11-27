import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

import fontkit from "./add-test-helpers-to-fontkit.js";
import { here } from "./utils/dir.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = here(import.meta.url);

describe("fontkit", function () {
  test("should open a font asynchronously", async () => {
    const font = await fontkit.open(__dirname + "/data/open-sans/open-sans-regular.ttf");
    expect(font.constructor.name).toBe("TTFFont");
  });

  test("should open fonts of different formats", async () => {
    let font = await fontkit.open(__dirname + "/data/open-sans/open-sans-regular.ttf");
    expect(font.constructor.name).toBe("TTFFont");

    font = await fontkit.open(__dirname + "/data/source-sans-pro/source-sans-pro-regular.otf");
    expect(font.constructor.name).toBe("TTFFont");

    font = await fontkit.open(__dirname + "/data/noto-sans/noto-sans.ttc");
    expect(font.constructor.name).toBe("TrueTypeCollection");

    font = await fontkit.open(__dirname + "/data/noto-sans/noto-sans.ttc", "NotoSans");
    expect(font.constructor.name).toBe("TTFFont");

    font = await fontkit.open(__dirname + "/data/noto-sans/noto-sans.dfont");
    expect(font.constructor.name).toBe("DFont");

    font = await fontkit.open(__dirname + "/data/noto-sans/noto-sans.dfont", "NotoSans");
    expect(font.constructor.name).toBe("TTFFont");

    font = await fontkit.open(__dirname + "/data/source-sans-pro/source-sans-pro-regular.woff");
    expect(font.constructor.name).toBe("WOFFFont");

    font = await fontkit.open(__dirname + "/data/source-sans-pro/source-sans-pro-regular.woff2");
    expect(font.constructor.name).toBe("WOFF2Font");
  });

  test("should open fonts lacking PostScript name", async () => {
    const font = await fontkit.open(__dirname + "/data/mada/mada-regular.subset1.ttf");
    expect(font.postscriptName).toBeNull();
  });

  test("should error when opening an invalid font asynchronously", async () => {
    await expect(fontkit.open(__filename)).rejects.toThrow(/Unknown font format/);
  });

  test("should get collection objects for ttc fonts", async () => {
    const collection = await fontkit.open(__dirname + "/data/noto-sans/noto-sans.ttc");
    expect(collection.constructor.name).toBe("TrueTypeCollection");

    if (!collection.fonts) {
      throw new Error("Expected font collection to expose fonts");
    }

    const names = collection.fonts.map((f: any) => f.postscriptName);
    expect(names).toEqual(["NotoSans-Bold", "NotoSans", "NotoSans-Italic", "NotoSans-BoldItalic"]);

    const font = collection.getFont("NotoSans-Italic");
    if (!font) {
      throw new Error("Expected collection to include requested font");
    }

    expect(font.postscriptName).toBe("NotoSans-Italic");
  });

  test("should get collection objects for dfonts", async () => {
    const collection = await fontkit.open(__dirname + "/data/noto-sans/noto-sans.dfont");
    expect(collection.constructor.name).toBe("DFont");

    if (!collection.fonts) {
      throw new Error("Expected font collection to expose fonts");
    }

    const names = collection.fonts.map((f: any) => f.postscriptName);
    expect(names).toEqual(["NotoSans", "NotoSans-Bold", "NotoSans-Italic", "NotoSans-BoldItalic"]);

    const font = collection.getFont("NotoSans-Italic");
    if (!font) {
      throw new Error("Expected collection to include requested font");
    }

    expect(font.postscriptName).toBe("NotoSans-Italic");
  });
});
