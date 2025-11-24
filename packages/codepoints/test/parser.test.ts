import { beforeAll, describe, expect, test } from "vitest";

import parser, { type CodePointTable } from "../src/parser.js";

let codePoints: CodePointTable;

beforeAll(() => {
  codePoints = parser();
});

describe("parser", () => {
  test("loads metadata for basic Latin letters", () => {
    const capitalA = codePoints[0x0041];
    const smallA = codePoints[0x0061];

    expect(capitalA).toBeDefined();
    expect(capitalA?.name).toBe("LATIN CAPITAL LETTER A");
    expect(capitalA?.category).toBe("Lu");
    expect(capitalA?.block).toBe("Basic Latin");
    expect(capitalA?.script).toBe("Latin");
    expect(capitalA?.eastAsianWidth).toBe("Na");
    expect(capitalA?.lowercase).toEqual([0x0061]);

    expect(smallA).toBeDefined();
    expect(smallA?.name).toBe("LATIN SMALL LETTER A");
    expect(smallA?.category).toBe("Ll");
    expect(smallA?.block).toBe("Basic Latin");
    expect(smallA?.uppercase).toEqual([0x0041]);
  });

  test("marks compatibility decompositions and canonical compositions", () => {
    const noBreakSpace = codePoints[0x00a0];
    const combiningDiaeresis = codePoints[0x0308];

    expect(noBreakSpace).toBeDefined();
    expect(noBreakSpace?.isCompat).toBe(true);
    expect(noBreakSpace?.decomposition).toEqual([0x0020]);

    expect(combiningDiaeresis).toBeDefined();
    expect(combiningDiaeresis?.isCompat).toBe(false);
    expect(combiningDiaeresis?.compositions[0x0041]).toBe(0x00c4);
  });

  test("applies derived metadata from supplemental files", () => {
    const combiningAcute = codePoints[0x0301];
    const aegeanSixtyThousand = codePoints[0x10130];

    expect(combiningAcute).toBeDefined();
    expect(combiningAcute?.combiningClass).toBe(230);
    expect(combiningAcute?.combiningClassName).toBe("Above");

    expect(aegeanSixtyThousand).toBeDefined();
    expect(aegeanSixtyThousand?.numeric).toBe("60000");
  });

  test("records normalization quick-check and conditional casing data", () => {
    const dottedCapitalI = codePoints[0x0130];

    expect(dottedCapitalI).toBeDefined();
    expect(dottedCapitalI?.NFD_QC).toBe(1);
    expect(dottedCapitalI?.NFKD_QC).toBe(1);
    expect(dottedCapitalI?.caseConditions).not.toBeNull();
    expect(dottedCapitalI?.caseConditions).toEqual(
      expect.arrayContaining(["az"]),
    );
  });

  test("fills in range entries and Arabic joining metadata", () => {
    const cjkExtensionA = codePoints[0x3401];
    const arabicBeh = codePoints[0x0628];

    expect(cjkExtensionA).toBeDefined();
    expect(cjkExtensionA?.code).toBe(0x3401);

    expect(arabicBeh).toBeDefined();
    expect(arabicBeh?.joiningType).toBe("Dual_Joining");
    expect(arabicBeh?.joiningGroup).toBe("BEH");
  });
});
