import { EncodeStream } from "@chr33s/pdf-restructure";
import { describe, expect, test } from "vitest";

import Path from "../src/glyph/path.js";
import CFF2Subset, { encodePathToCharString } from "../src/subset/cff2-subset.js";
import TTFFont from "../src/ttf-font.js";

describe("CFF2 subsetting", () => {
  test("createSubset returns CFF2Subset for CFF2 fonts", () => {
    const font = Object.create(TTFFont.prototype) as TTFFont & {
      directory: { tables: Record<string, unknown> };
      CFF2: unknown;
    };

    font.directory = { tables: { CFF2: {} } } as any;
    font.CFF2 = {};

    const subset = TTFFont.prototype.createSubset.call(font);
    expect(subset).toBeInstanceOf(CFF2Subset);
  });

  test("createSubset throws for variable CFF2 fonts", () => {
    const font = Object.create(TTFFont.prototype) as TTFFont & {
      directory: { tables: Record<string, unknown> };
      CFF2: unknown;
      fvar: unknown;
    };

    font.directory = { tables: { CFF2: {}, fvar: {} } } as any;
    font.CFF2 = {};
    font.fvar = {} as any;

    expect(() => TTFFont.prototype.createSubset.call(font)).toThrow(/pre-instanced/i);
  });

  test("encodes a square path into a Type 2 charstring", () => {
    const path = new Path();
    path.moveTo(0, 0);
    path.lineTo(100, 0);
    path.lineTo(100, 100);
    path.lineTo(0, 100);
    path.closePath();

    const charstring = encodePathToCharString(path, 500);

    expect(Array.from(charstring)).toEqual([
      0xf8, 0x88, 139, 139, 0x15, 0xef, 139, 0x05, 139, 0xef, 0x05, 0x27, 139, 0x05, 139, 0x27,
      0x05, 0x0e,
    ]);
  });
});

describe("CFF2 subset widths", () => {
  const makeStubFont = () => {
    const metricsRecord = { advance: 500, bearing: 0 };
    const metricArray = {
      length: 2,
      get: (index: number) => (index === 0 ? metricsRecord : undefined),
    };
    const bearingArray = { get: () => 0 };

    const glyph = {
      id: 0,
      _usedGsubrs: {},
      async getPath() {
        return {
          commands: [{ command: "moveTo", args: [0, 0] }],
        } as any;
      },
      async _getMetrics() {
        return {
          advanceWidth: 500,
          advanceHeight: 1000,
          leftBearing: 0,
          topBearing: 0,
          width: 0,
          height: 0,
          rightBearing: 500,
          bottomBearing: 0,
        };
      },
    };

    const font: any = {
      CFF2: { hdrSize: 4, header: {} },
      head: { unitsPerEm: 1000, xMin: 0, yMin: 0, xMax: 0, yMax: 0 },
      hhea: { ascent: 800, descent: -200, lineGap: 0, numberOfMetrics: 1 },
      maxp: { numGlyphs: 1 },
      hmtx: { metrics: metricArray, bearings: bearingArray },
      postscriptName: "StubPS",
      getGlyph() {
        return glyph;
      },
    };

    return { font, glyph } as const;
  };

  test("hmtx advance matches glyph metrics", async () => {
    const { font } = makeStubFont();
    const subset = new CFF2Subset(font);
    const stream = new (await import("@chr33s/pdf-restructure")).EncodeStream(new Uint8Array(1024));

    // Capture tables without full decode.
    let capturedTables: Record<string, unknown> | null = null;
    const Directory = await import("../src/tables/directory.js");
    const originalDirEncode = Directory.default.encode.bind(Directory.default);
    Directory.default.encode = (_stream: any, payload: { tables: Record<string, unknown> }) => {
      capturedTables = payload.tables;
    };

    await (subset as any).encode(stream);
    Directory.default.encode = originalDirEncode;

    const tables = capturedTables as unknown as { hmtx: { metrics: Array<{ advance: number }> } };
    expect(tables.hmtx.metrics[0].advance).toBe(500);
  });
});

describe("CFF2 subset tables", () => {
  const makeStubFont = () => {
    const metricsRecord = { advance: 500, bearing: 0 };
    const metricArray = {
      length: 1,
      get: () => metricsRecord,
    };
    const bearingArray = { get: () => 0 };

    const glyph = {
      id: 0,
      _usedGsubrs: {},
      async getPath() {
        return {
          commands: [{ command: "moveTo", args: [0, 0] }],
        } as any;
      },
      async _getMetrics() {
        return {
          advanceWidth: 500,
          advanceHeight: 1000,
          leftBearing: 0,
          topBearing: 0,
          width: 0,
          height: 0,
          rightBearing: 500,
          bottomBearing: 0,
        };
      },
    };

    const font: any = {
      CFF2: { hdrSize: 4, header: {} },
      head: { unitsPerEm: 1000, xMin: 0, yMin: 0, xMax: 0, yMax: 0 },
      hhea: { ascent: 800, descent: -200, lineGap: 0, numberOfMetrics: 1 },
      maxp: { numGlyphs: 1 },
      hmtx: { metrics: metricArray, bearings: bearingArray },
      postscriptName: "StubPS",
      name: { records: { postscriptName: { en: "BasePS" } } },
      "OS/2": { sFamilyClass: 0 },
      post: { italicAngle: 0, underlinePosition: 0, underlineThickness: 0, isFixedPitch: false },
      cmap: { dummy: true },
      vmtx: { metrics: metricArray, bearings: bearingArray },
      VORG: { dummy: true },
      fvar: { shouldBeSkipped: true },
      getGlyph() {
        return glyph;
      },
    };

    return { font, glyph } as const;
  };

  test("includes core and default extra tables while excluding variation tables", async () => {
    const { font } = makeStubFont();
    const subset = new CFF2Subset(font);
    const stream = new EncodeStream(new Uint8Array(4096));

    let capturedTables: Record<string, unknown> | null = null;

    // Monkey-patch Directory.encode to capture tables without needing full encoders.
    const Directory = await import("../src/tables/directory.js");
    const originalDirEncode = Directory.default.encode.bind(Directory.default);
    Directory.default.encode = (
      _stream: EncodeStream,
      payload: { tables: Record<string, unknown> },
    ) => {
      capturedTables = payload.tables;
    };

    await (subset as any).encode(stream);

    Directory.default.encode = originalDirEncode;

    expect(capturedTables).not.toBeNull();
    const tables = capturedTables as unknown as Record<string, unknown>;
    expect(tables).toHaveProperty("CFF ");
    expect(tables).toHaveProperty("name");
    expect(tables).toHaveProperty("OS/2");
    expect(tables).toHaveProperty("post");
    expect(tables).toHaveProperty("cmap");
    expect(tables).toHaveProperty("vmtx");
    expect(tables).toHaveProperty("VORG");
    expect(tables).not.toHaveProperty("fvar");
    expect(tables).not.toHaveProperty("HVAR");

    const psRecord = (tables.name as any)?.records?.postscriptName;
    const psName = psRecord && Object.values(psRecord)[0];
    expect(typeof psName === "string").toBe(true);
    expect(psName as string).toMatch(/^[A-Z]{6}\+/);
  });
});
