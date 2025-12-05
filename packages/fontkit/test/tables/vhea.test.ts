import { describe, expect, test } from "vitest";

import fontkit, { here } from "../helpers.js";

const __dirname = here(import.meta.url);

describe("vhea table test", async function () {
  const font = await fontkit.open(
    __dirname + "/../data/noto-sans-cjk/noto-sans-cj-kkr-regular.otf",
  );

  test("should retrieve vhea table correctly", function () {
    const actualVheaObject = font.vhea;

    const expectedVheaObject = {
      version: 1.1,
      ascent: 500,
      descent: -500,
      lineGap: 0,
      advanceHeightMax: 3000,
      minTopSideBearing: -1002,
      minBottomSideBearing: -677,
      yMaxExtent: 2928,
      caretSlopeRise: 0,
      caretSlopeRun: 1,
      caretOffset: 0,
      metricDataFormat: 0,
      numberOfMetrics: 65167,
    };

    expect(actualVheaObject).toStrictEqual(expectedVheaObject);
  });
});
