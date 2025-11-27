import { beforeAll, describe, expect, test } from "vitest";

import fontkit from "./add-test-helpers-to-fontkit.js";
import { here } from "./utils/dir.js";

const __dirname = here(import.meta.url);

describe("metadata", function () {
  let font: Awaited<ReturnType<typeof fontkit.open>>;

  beforeAll(async () => {
    font = await fontkit.open(__dirname + "/data/open-sans/open-sans-regular.ttf");
  });

  test("decodes SFNT directory values correctly", function () {
    let dir = font.directory;
    expect(dir.numTables).toBe(19);
    expect(dir.searchRange).toBe(256);
    expect(dir.entrySelector).toBe(4);
    expect(dir.rangeShift).toBe(48);
  });

  test("numTables matches table collection", function () {
    let dir = font.directory;
    expect(Object.keys(dir.tables).length).toBe(dir.numTables);
  });
});
