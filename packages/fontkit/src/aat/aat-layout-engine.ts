import type {
  FeatureSelectionMap,
  FeatureTupleInput,
} from "./aat-feature-map.js";
import * as AATFeatureMap from "./aat-feature-map.js";
import type { FontLike, Glyph } from "./aat-morx-processor.js";
import AATMorxProcessor from "./aat-morx-processor.js";

type GlyphFeatureMap = Record<string, boolean>;
type GlyphRunLike = {
  direction: string;
  glyphs: Glyph[];
  features: GlyphFeatureMap;
};

interface CMAPProcessor {
  codePointsForGlyph(gid: number): number[];
}

export interface LayoutFontLike extends FontLike {
  _cmapProcessor: CMAPProcessor;
}

export default class AATLayoutEngine {
  #font: LayoutFontLike;
  #morxProcessor: AATMorxProcessor;
  #fallbackPosition: boolean;

  constructor(font: LayoutFontLike) {
    this.#font = font;
    this.#morxProcessor = new AATMorxProcessor(font);
    this.#fallbackPosition = false;
  }

  get font(): LayoutFontLike {
    return this.#font;
  }

  get morxProcessor(): AATMorxProcessor {
    return this.#morxProcessor;
  }

  get fallbackPosition(): boolean {
    return this.#fallbackPosition;
  }

  set fallbackPosition(value: boolean) {
    this.#fallbackPosition = value;
  }

  substitute(glyphRun: GlyphRunLike): void {
    // AAT expects the glyphs to be in visual order prior to morx processing,
    // so reverse the glyphs if the script is right-to-left.
    if (glyphRun.direction === "rtl") {
      glyphRun.glyphs.reverse();
    }

    const features: FeatureSelectionMap = AATFeatureMap.mapOTToAAT(
      glyphRun.features,
    );

    this.#morxProcessor.process(glyphRun.glyphs, features);
  }

  getAvailableFeatures(_script: string, _language: string): string[] {
    const supportedFeatures =
      this.#morxProcessor.getSupportedFeatures() as FeatureTupleInput[];
    return AATFeatureMap.mapAATToOT(supportedFeatures);
  }

  stringsForGlyph(gid: number): Set<string> {
    const glyphStrings = this.#morxProcessor.generateInputs(gid);
    const result = new Set<string>();

    for (const glyphs of glyphStrings) {
      this.#addStrings(glyphs, 0, result, "");
    }

    return result;
  }

  #addStrings(
    glyphs: number[],
    index: number,
    strings: Set<string>,
    current: string,
  ): void {
    const codePoints = this.#font._cmapProcessor.codePointsForGlyph(
      glyphs[index],
    );

    for (const codePoint of codePoints) {
      const nextString = current + String.fromCodePoint(codePoint);
      if (index < glyphs.length - 1) {
        this.#addStrings(glyphs, index + 1, strings, nextString);
      } else {
        strings.add(nextString);
      }
    }
  }
}
