import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import type { Font } from "../packages/fontkit/dist/base.js";
import type Glyph from "../packages/fontkit/dist/glyph/glyph.js";
import fontkit from "../packages/fontkit/dist/index.js";
import type GlyphPosition from "../packages/fontkit/dist/layout/glyph-position.js";
import type { TypeFeatures } from "../packages/fontkit/dist/types.js";

// node ./scripts/fontkit-inspect.ts --font=./debug-font.ttf --text "Sphinx of black quartz, judge my vow."

export type GlyphDiagnostics = {
  id: number;
  codePoints: number[];
  isLigature: boolean;
  isMark: boolean;
};

export type FontLayoutDiagnostics = {
  fontPath: string;
  postscriptName?: string;
  text: string;
  glyphs: GlyphDiagnostics[];
  positions: Array<Pick<GlyphPosition, "xAdvance" | "yAdvance" | "xOffset" | "yOffset">>;
  missingCodePoints: number[];
  characterSetSize: number;
  availableFeatures: string[];
  appliedFeatures: Record<string, boolean>;
  script: string | string[];
  language: string | null;
  direction: string;
  advanceWidth: number;
};

type InspectOptions = {
  fontPath: string;
  text: string;
  postscriptName?: string;
  script?: string | null;
  language?: string | null;
  direction?: string | null;
  features?: TypeFeatures | string[] | Record<string, boolean> | string;
};

function toCodePoints(text: string): number[] {
  const points: number[] = [];
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (typeof codePoint === "number") {
      points.push(codePoint);
    }
  }
  return points;
}

function collectMissingCodePoints(font: Font, text: string): number[] {
  const missing = new Set<number>();
  for (const codePoint of toCodePoints(text)) {
    if (!font.hasGlyphForCodePoint(codePoint)) {
      missing.add(codePoint);
    }
  }
  return Array.from(missing).sort((a, b) => a - b);
}

function mapGlyph(glyph: Glyph): GlyphDiagnostics {
  return {
    codePoints: glyph.codePoints,
    id: glyph.id,
    isLigature: glyph.isLigature,
    isMark: glyph.isMark,
  };
}

export async function inspectFontLayout(options: InspectOptions): Promise<FontLayoutDiagnostics> {
  const fontPath = resolve(options.fontPath);
  const font = await fontkit.create(await readFile(fontPath), options.postscriptName);
  const run = await font.layout(
    options.text,
    options.features ?? undefined,
    options.script ?? null,
    options.language ?? null,
    options.direction ?? null,
  );

  const positions = run.positions
    ? run.positions.map(({ xAdvance, yAdvance, xOffset, yOffset }) => ({
        xAdvance,
        xOffset,
        yAdvance,
        yOffset,
      }))
    : [];

  const availableFeatures =
    typeof font.getAvailableFeatures === "function"
      ? font.getAvailableFeatures(
          typeof run.script === "string" ? run.script : run.script[0],
          run.language,
        )
      : font.availableFeatures || [];

  return {
    advanceWidth: run.advanceWidth,
    appliedFeatures: run.features,
    availableFeatures,
    characterSetSize: font.characterSet.length,
    direction: run.direction,
    fontPath,
    glyphs: run.glyphs.map(mapGlyph),
    language: run.language,
    missingCodePoints: collectMissingCodePoints(font, options.text),
    positions,
    postscriptName: options.postscriptName,
    script: run.script,
    text: options.text,
  };
}

function formatCodePointList(codePoints: number[]): string {
  if (!codePoints.length) return "none";
  return codePoints.map((cp) => `U+${cp.toString(16).toUpperCase()}`).join(", ");
}

function logDiagnostics(diagnostics: FontLayoutDiagnostics): void {
  console.log(`Font: ${diagnostics.fontPath}`);
  if (diagnostics.postscriptName) {
    console.log(`PostScript name: ${diagnostics.postscriptName}`);
  }
  console.log(`Text: ${diagnostics.text}`);
  console.log(`Glyphs: ${diagnostics.glyphs.length}`);
  console.log(`Missing code points: ${formatCodePointList(diagnostics.missingCodePoints)}`);
  console.log(`Direction: ${diagnostics.direction}`);
  console.log(
    `Script: ${Array.isArray(diagnostics.script) ? diagnostics.script.join(",") : diagnostics.script}`,
  );
  console.log(`Language: ${diagnostics.language ?? "(default)"}`);
  console.log(`Advance width: ${diagnostics.advanceWidth}`);
  console.log(`Available features: ${diagnostics.availableFeatures.join(", ") || "none"}`);
  console.log(`Applied features: ${Object.keys(diagnostics.appliedFeatures).join(", ") || "none"}`);
  console.log("Glyph map:");
  diagnostics.glyphs.forEach((glyph, index) => {
    const position = diagnostics.positions[index];
    const codePoints = formatCodePointList(glyph.codePoints);
    const pos = position
      ? ` adv=(${position.xAdvance}, ${position.yAdvance}) offset=(${position.xOffset}, ${position.yOffset})`
      : "";
    console.log(`  [${index}] id=${glyph.id} codePoints=${codePoints}${pos}`);
  });
}

async function main(): Promise<void> {
  const args = parseArgs({
    options: {
      direction: { short: "d", type: "string" },
      font: { short: "f", type: "string" },
      json: { short: "j", type: "string" },
      language: { short: "l", type: "string" },
      postscript: { short: "p", type: "string" },
      script: { short: "s", type: "string" },
      text: { short: "t", type: "string", default: "Sphinx of black quartz, judge my vow." },
    },
  });

  const fontPath = args.values.font as string | undefined;
  if (!fontPath) {
    throw new Error("--font is required");
  }

  const diagnostics = await inspectFontLayout({
    direction: (args.values.direction as string | undefined) ?? null,
    fontPath,
    language: (args.values.language as string | undefined) ?? null,
    postscriptName: args.values.postscript as string | undefined,
    script: (args.values.script as string | undefined) ?? null,
    text: String(args.values.text),
  });

  const jsonPath = args.values.json as string | undefined;
  if (jsonPath) {
    const outputPath = resolve(jsonPath);
    await writeFile(outputPath, `${JSON.stringify(diagnostics, null, 2)}\n`, "utf-8");
    console.log(`Wrote diagnostics to ${outputPath}`);
    return;
  }

  logDiagnostics(diagnostics);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
