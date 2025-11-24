import assert from "node:assert";
import { describe, test } from "vitest";

import fontkit from "./add-test-helpers-to-fontkit.js";
import { here } from "./utils/dir.js";

const __dirname = here(import.meta.url);

describe("metadata", function () {
  let font = fontkit.openSync(
    __dirname + "/data/OpenSans/OpenSans-Regular.ttf",
  );

  test("decodes SFNT directory values correctly", function () {
    let dir = font.directory;
    assert.equal(dir.numTables, 19);
    assert.equal(dir.searchRange, 256);
    assert.equal(dir.entrySelector, 4);
    assert.equal(dir.rangeShift, 48);
  });

  test("numTables matches table collection", function () {
    let dir = font.directory;
    assert.equal(Object.keys(dir.tables).length, dir.numTables);
  });
});
