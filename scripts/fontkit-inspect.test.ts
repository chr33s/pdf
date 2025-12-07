import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

import { inspectFontLayout } from "./fontkit-inspect.js";

const amiriFont = fileURLToPath(
  new URL("../packages/fontkit/test/data/amiri/amiri-regular.ttf", import.meta.url),
);

describe("inspectFontLayout", () => {
  test("returns glyphs, positions, and coverage", async () => {
    const result = await inspectFontLayout({ fontPath: amiriFont, text: "ABC" });

    expect(result.glyphs.length).toBe(3);
    expect(result.positions.length).toBe(3);
    expect(result.missingCodePoints).toStrictEqual([]);
    expect(result.characterSetSize).toBeGreaterThan(0);
  });

  test("flags missing code points", async () => {
    const emoji = "\u{1F600}";
    const result = await inspectFontLayout({ fontPath: amiriFont, text: emoji });

    expect(result.glyphs.length).toBe(1);
    expect(result.missingCodePoints).toContain(0x1f600);
  });
});
