import AATLayoutEngine, {
  type LayoutFontLike as AATLayoutFontLike,
} from "../aat/aat-layout-engine.js";
import type Glyph from "../glyph/glyph.js";
import type { FontLike as GlyphFontLike } from "../glyph/glyph.js";
import OTLayoutEngine from "../opentype/ot-layout-engine.js";
import GlyphPosition from "./glyph-position.js";
import GlyphRun from "./glyph-run.js";
import KernProcessor, { type KernTable } from "./kern-processor.js";
import * as Script from "./script.js";
import UnicodeLayoutEngine from "./unicode-layout-engine.js";

type LayoutFeatures = string[] | Record<string, boolean> | undefined;
type ScriptValue = string | string[] | null;

type AdvancedLayoutEngine = {
  substitute(glyphRun: GlyphRun): void;
  position?(glyphRun: GlyphRun): { kern?: boolean } | null;
  setup?(glyphRun: GlyphRun): void;
  cleanup?(): void;
  fallbackPosition?: boolean;
  getAvailableFeatures(script?: string | null, language?: string | null): string[];
  stringsForGlyph?(gid: number): Iterable<string> | string[];
};

export default class LayoutEngine {
  font: GlyphFontLike;
  unicodeLayoutEngine: UnicodeLayoutEngine | null;
  kernProcessor: KernProcessor | null;
  engine: AdvancedLayoutEngine | null;

  constructor(font: GlyphFontLike) {
    this.font = font;
    this.unicodeLayoutEngine = null;
    this.kernProcessor = null;
    this.engine = null;

    // Choose an advanced layout engine. We try the AAT morx table first since more
    // scripts are currently supported because the shaping logic is built into the font.
    if (this.font.morx) {
      this.engine = new AATLayoutEngine(this.font as unknown as AATLayoutFontLike);
    } else if (this.font.GSUB || this.font.GPOS) {
      this.engine = new OTLayoutEngine(this.font);
    }
  }

  layout(
    input: string | Glyph[],
    features?: string[] | Record<string, boolean> | string,
    script?: string | null,
    language?: string | null,
    direction?: string | null,
  ): GlyphRun {
    let resolvedScript: ScriptValue = script ?? null;
    let resolvedLanguage = language ?? null;
    let resolvedDirection = direction ?? null;
    let normalizedFeatures: LayoutFeatures = undefined;

    if (typeof features === "string") {
      resolvedDirection = language ?? null;
      resolvedLanguage = script ?? null;
      resolvedScript = features;
    } else {
      normalizedFeatures = features;
    }

    let glyphs: Glyph[];
    if (typeof input === "string") {
      if (resolvedScript == null) {
        resolvedScript = Script.forString(input);
      }

      glyphs = this.font.glyphsForString(input);
    } else {
      if (resolvedScript == null) {
        const codePoints: number[] = [];
        for (let glyph of input) {
          codePoints.push(...glyph.codePoints);
        }

        resolvedScript = Script.forCodePoints(codePoints);
      }

      glyphs = input;
    }

    const scriptValue = this.#normalizeScript(resolvedScript);

    let glyphRun = new GlyphRun(
      glyphs,
      normalizedFeatures,
      scriptValue,
      resolvedLanguage,
      resolvedDirection,
    );

    // Return early if there are no glyphs
    if (glyphs.length === 0) {
      glyphRun.positions = [];
      return glyphRun;
    }

    // Setup the advanced layout engine
    if (this.engine && this.engine.setup) {
      this.engine.setup(glyphRun);
    }

    // Substitute and position the glyphs
    this.substitute(glyphRun);
    this.position(glyphRun);

    if (!glyphRun.positions) {
      glyphRun.positions = [];
    }

    this.hideDefaultIgnorables(glyphRun.glyphs, glyphRun.positions);

    // Let the layout engine clean up any state it might have
    if (this.engine && this.engine.cleanup) {
      this.engine.cleanup();
    }

    return glyphRun;
  }

  substitute(glyphRun: GlyphRun): void {
    // Call the advanced layout engine to make substitutions
    if (this.engine && this.engine.substitute) {
      this.engine.substitute(glyphRun);
    }
  }

  position(glyphRun: GlyphRun): void {
    // Get initial glyph positions
    glyphRun.positions = glyphRun.glyphs.map((glyph) => new GlyphPosition(glyph.advanceWidth));
    let positioned: { kern?: boolean } | null = null;

    // Call the advanced layout engine. Returns the features applied.
    if (this.engine && this.engine.position) {
      positioned = this.engine.position(glyphRun);
    }

    // if there is no GPOS table, use unicode properties to position marks.
    if (!positioned && (!this.engine || this.engine.fallbackPosition)) {
      if (!this.unicodeLayoutEngine) {
        this.unicodeLayoutEngine = new UnicodeLayoutEngine(this.font);
      }

      this.unicodeLayoutEngine.positionGlyphs(glyphRun.glyphs, glyphRun.positions);
    }

    // if kerning is not supported by GPOS, do kerning with the TrueType/AAT kern table
    if ((!positioned || !positioned.kern) && glyphRun.features.kern !== false && this.font.kern) {
      const kernData = this.font.kern;
      if (!kernData?.tables) {
        return;
      }

      if (!this.kernProcessor) {
        this.kernProcessor = new KernProcessor({
          kern: kernData as { tables: KernTable[] },
        });
      }

      this.kernProcessor.process(glyphRun.glyphs, glyphRun.positions);
      glyphRun.features.kern = true;
    }
  }

  hideDefaultIgnorables(glyphs: Glyph[], positions: GlyphPosition[]): void {
    let space = this.font.glyphForCodePoint(0x20);
    for (let i = 0; i < glyphs.length; i++) {
      if (this.isDefaultIgnorable(glyphs[i].codePoints[0])) {
        glyphs[i] = space;
        positions[i].xAdvance = 0;
        positions[i].yAdvance = 0;
      }
    }
  }

  isDefaultIgnorable(ch: number): boolean {
    // From DerivedCoreProperties.txt in the Unicode database,
    // minus U+115F, U+1160, U+3164 and U+FFA0, which is what
    // Harfbuzz and Uniscribe do.
    let plane = ch >> 16;
    if (plane === 0) {
      // BMP
      switch (ch >> 8) {
        case 0x00:
          return ch === 0x00ad;
        case 0x03:
          return ch === 0x034f;
        case 0x06:
          return ch === 0x061c;
        case 0x17:
          return 0x17b4 <= ch && ch <= 0x17b5;
        case 0x18:
          return 0x180b <= ch && ch <= 0x180e;
        case 0x20:
          return (
            (0x200b <= ch && ch <= 0x200f) ||
            (0x202a <= ch && ch <= 0x202e) ||
            (0x2060 <= ch && ch <= 0x206f)
          );
        case 0xfe:
          return (0xfe00 <= ch && ch <= 0xfe0f) || ch === 0xfeff;
        case 0xff:
          return 0xfff0 <= ch && ch <= 0xfff8;
        default:
          return false;
      }
    } else {
      // Other planes
      switch (plane) {
        case 0x01:
          return (0x1bca0 <= ch && ch <= 0x1bca3) || (0x1d173 <= ch && ch <= 0x1d17a);
        case 0x0e:
          return 0xe0000 <= ch && ch <= 0xe0fff;
        default:
          return false;
      }
    }
  }

  getAvailableFeatures(script?: string | string[] | null, language?: string | null): string[] {
    let features: string[] = [];
    const scriptTag = this.#firstScript(script);

    if (this.engine) {
      features.push(...this.engine.getAvailableFeatures(scriptTag, language ?? null));
    }

    if (this.font.kern && features.indexOf("kern") === -1) {
      features.push("kern");
    }

    return features;
  }

  stringsForGlyph(gid: number): string[] {
    let result = new Set<string>();

    let codePoints = this.font._cmapProcessor.codePointsForGlyph(gid);
    for (let codePoint of codePoints) {
      result.add(String.fromCodePoint(codePoint));
    }

    if (this.engine && this.engine.stringsForGlyph) {
      for (let string of this.engine.stringsForGlyph(gid) ?? []) {
        result.add(string);
      }
    }

    return Array.from(result);
  }

  #normalizeScript(script: ScriptValue): string | string[] {
    if (script == null) {
      return "DFLT";
    }

    return script;
  }

  #firstScript(script: string | string[] | null | undefined): string | null {
    if (!script) {
      return null;
    }

    return Array.isArray(script) ? (script[0] ?? null) : script;
  }
}
