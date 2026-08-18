import type { FontLike } from "../glyph/glyph.js";
import type GlyphPosition from "../layout/glyph-position.js";
import type GlyphRun from "../layout/glyph-run.js";
import GlyphInfo from "./glyph-info.js";
import GPOSProcessor from "./gpos-processor.js";
import GSUBProcessor from "./gsub-processor.js";
import { choose as chooseShaper, type ShaperModule } from "./shapers/index.js";
import ShapingPlan from "./shaping-plan.js";

export default class OTLayoutEngine {
  font: FontLike;
  glyphInfos: GlyphInfo[] | null;
  plan: ShapingPlan | null;
  GSUBProcessor: GSUBProcessor | null;
  GPOSProcessor: GPOSProcessor | null;
  shaper: ShaperModule | null;
  fallbackPosition: boolean;

  constructor(font: FontLike) {
    this.font = font;
    this.glyphInfos = null;
    this.plan = null;
    this.GSUBProcessor = null;
    this.GPOSProcessor = null;
    this.shaper = null;
    this.fallbackPosition = true;

    if (font.GSUB) {
      this.GSUBProcessor = new GSUBProcessor(font, font.GSUB);
    }

    if (font.GPOS) {
      this.GPOSProcessor = new GPOSProcessor(font, font.GPOS);
    }
  }

  async setup(glyphRun: GlyphRun): Promise<void> {
    // Map glyphs to GlyphInfo objects so data can be passed between
    // GSUB and GPOS without mutating the real (shared) Glyph objects.
    this.glyphInfos = glyphRun.glyphs.map(
      (glyph) => new GlyphInfo(this.font, glyph.id, [...glyph.codePoints]),
    );

    // Select a script based on what is available in GSUB/GPOS.
    let script = null;
    if (this.GPOSProcessor) {
      script = this.GPOSProcessor.selectScript(
        glyphRun.script,
        glyphRun.language,
        glyphRun.direction,
      );
    }

    if (this.GSUBProcessor) {
      script = this.GSUBProcessor.selectScript(
        glyphRun.script,
        glyphRun.language,
        glyphRun.direction,
      );
    }

    // Choose a shaper based on the script, and setup a shaping plan.
    // This determines which features to apply to which glyphs.
    const shaper = chooseShaper(script);
    this.shaper = shaper;
    this.plan = new ShapingPlan(this.font, script, glyphRun.direction);
    await shaper.plan(this.plan, this.glyphInfos, glyphRun.features);

    // Assign chosen features to output glyph run
    for (let key in this.plan.allFeatures) {
      glyphRun.features[key] = true;
    }
  }

  async substitute(glyphRun: GlyphRun): Promise<void> {
    if (this.GSUBProcessor && this.plan && this.glyphInfos) {
      this.plan.process(this.GSUBProcessor, this.glyphInfos);

      // Map glyph infos back to normal Glyph objects
      glyphRun.glyphs = this.glyphInfos.map((glyphInfo) =>
        this.font.getGlyph(glyphInfo.id, glyphInfo.codePoints),
      );
    }
  }

  position(glyphRun: GlyphRun): Record<string, unknown> | null {
    if (!glyphRun.positions) {
      throw new Error("Glyph positions must be initialized before positioning");
    }

    if (this.shaper?.zeroMarkWidths === "BEFORE_GPOS") {
      this.zeroMarkAdvances(glyphRun.positions);
    }

    if (this.GPOSProcessor) {
      if (!this.plan || !this.glyphInfos) {
        return null;
      }

      this.plan.process(this.GPOSProcessor, this.glyphInfos, glyphRun.positions);
    }

    if (this.shaper?.zeroMarkWidths === "AFTER_GPOS") {
      this.zeroMarkAdvances(glyphRun.positions);
    }

    // Reverse the glyphs and positions if the script is right-to-left
    if (glyphRun.direction === "rtl") {
      glyphRun.glyphs.reverse();
      glyphRun.positions.reverse();
    }

    return (this.GPOSProcessor && this.GPOSProcessor.features) || null;
  }

  zeroMarkAdvances(positions: GlyphPosition[]): void {
    if (!this.glyphInfos) {
      return;
    }

    for (let i = 0; i < this.glyphInfos.length; i++) {
      if (this.glyphInfos[i].isMark) {
        positions[i].xAdvance = 0;
        positions[i].yAdvance = 0;
      }
    }
  }

  cleanup(): void {
    this.glyphInfos = null;
    this.plan = null;
    this.shaper = null;
  }

  getAvailableFeatures(script?: string | null, language?: string | null): string[] {
    let features: string[] = [];

    if (this.GSUBProcessor) {
      this.GSUBProcessor.selectScript(script, language);
      features.push(...Object.keys(this.GSUBProcessor.features));
    }

    if (this.GPOSProcessor) {
      this.GPOSProcessor.selectScript(script, language);
      features.push(...Object.keys(this.GPOSProcessor.features));
    }

    return features;
  }
}
