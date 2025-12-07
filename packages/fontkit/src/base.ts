import * as r from "@chr33s/pdf-restructure";
import { toUint8Array } from "./binary.js";
import type BBox from "./glyph/b-box.js";
import type Glyph from "./glyph/glyph.js";
import type GlyphRun from "./layout/glyph-run.js";
import type Subset from "./subset/subset.js";
import type { TypeFeatures } from "./types.js";

type DecodeStream = InstanceType<typeof r.DecodeStream>;
type VariationSettings = Record<string, number>;

type DirectoryEntry = {
  tag: string;
  offset: number;
  length: number;
};

type DirectoryData = {
  tag: string;
  numTables: number;
  searchRange: number;
  entrySelector: number;
  rangeShift: number;
  tables: Record<string, DirectoryEntry>;
};

interface FontInstance {
  [key: string]: unknown;
  postscriptName: string | null;
  fullName: string | null;
  familyName: string | null;
  subfamilyName: string | null;
  copyright: string | null;
  version: string | null;
  unitsPerEm: number;
  ascent: number;
  descent: number;
  lineGap: number;
  underlinePosition: number;
  underlineThickness: number;
  italicAngle: number;
  capHeight: number;
  xHeight: number;
  numGlyphs: number;
  bbox: BBox;
  directory: DirectoryData;
  characterSet: number[];
  variationAxes: Record<string, unknown>;
  namedVariations: Record<string, VariationSettings>;
  cff: unknown;
  "OS/2"?: { sFamilyClass: number };
  head: { macStyle: { italic: boolean } };
  post: { isFixedPitch: boolean };
  hasGlyphForCodePoint(codePoint: number): boolean;
  glyphForCodePoint(codePoint: number): Glyph;
  glyphsForString(text: string): Glyph[];
  getGlyph(glyphId: number, codePoints?: number[]): Glyph;
  stringsForGlyph(glyphId: number): Promise<string[]>;
  availableFeatures: string[];
  getAvailableFeatures(script?: string | null, language?: string | null): string[];
  layout(
    text: string,
    userFeatures?: TypeFeatures | string[] | Record<string, boolean> | string,
  ): Promise<GlyphRun>;
  layout(
    text: string,
    userFeatures?: TypeFeatures | string[] | Record<string, boolean> | string,
    script?: string | null,
    language?: string | null,
    direction?: string | null,
  ): Promise<GlyphRun>;
  widthOfGlyph(glyphId: number): Promise<number>;
  createSubset(): Subset;
  getVariation(settings: VariationSettings | string): FontInstance;
  getName(key: string, lang?: string): string | null;
  getFont(postscriptName: VariationSettings | string): FontInstance | null;
  fonts?: FontInstance[];
}

type FontConstructor = {
  new (stream: DecodeStream, ...args: any[]): FontInstance;
  probe(buffer: Uint8Array): boolean;
};

export type Font = FontInstance;

export interface FontkitRegistry {
  logErrors: boolean;
  registerFormat(format: FontConstructor): void;
  create(data: ArrayBuffer | ArrayBufferView | Uint8Array, postscriptName?: string): Promise<Font>;
  create(
    data: ArrayBuffer | ArrayBufferView | Uint8Array,
    postscriptName?: VariationSettings | string,
  ): Promise<Font>;
}

export type { FontInstance };

const formats: FontConstructor[] = [];
const sanitizedFormats = new WeakMap<FontConstructor, FontConstructor>();

function getNamedFormat(format: FontConstructor): FontConstructor {
  let named = sanitizedFormats.get(format);
  if (named) {
    return named;
  }

  const rawName = format.name || "";
  const desiredName = rawName.startsWith("_") ? rawName.slice(1) : rawName;

  if (!desiredName || desiredName === rawName) {
    sanitizedFormats.set(format, format);
    return format;
  }

  const NamedFormat = {
    [desiredName]: class extends format {},
  }[desiredName];

  sanitizedFormats.set(format, NamedFormat);
  return NamedFormat;
}

// Lazy initialization function - will be set by index.ts
let initFn: (() => Promise<unknown>) | null = null;

export function setInitializer(fn: () => Promise<unknown>): void {
  initFn = fn;
}

export type Fontkit = FontkitRegistry & {
  defaultLanguage: string;
  setDefaultLanguage: (lang?: string) => void;
};

const fontkit: Fontkit = {
  logErrors: false,
  defaultLanguage: "en",

  setDefaultLanguage: (lang = "en") => {
    fontkit.defaultLanguage = lang;
  },

  registerFormat: (format: FontConstructor) => {
    formats.push(getNamedFormat(format));
  },

  create: async (uint8ArrayFontData, postscriptName) => {
    // Auto-initialize shapers on first use
    if (initFn) {
      await initFn();
    }

    const buffer = toUint8Array(uint8ArrayFontData);
    for (let i = 0; i < formats.length; i++) {
      const format = formats[i];
      if (format.probe(buffer)) {
        const font = new format(new r.DecodeStream(buffer)) as FontInstance & {
          init?: () => Promise<void>;
        };
        // Initialize async resources if the font has an init method (e.g., WOFF)
        if (typeof font.init === "function") {
          await font.init();
        }
        if (postscriptName) {
          const resolvedFont = font.getFont(postscriptName);
          if (!resolvedFont) {
            const requestedName =
              typeof postscriptName === "string" ? postscriptName : JSON.stringify(postscriptName);
            throw new Error(`Font "${requestedName}" was not found within the font collection`);
          }
          return resolvedFont;
        }
        return font;
      }
    }
    throw new Error("Unknown font format");
  },
};

export default fontkit;
