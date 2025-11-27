import type { FontLike } from "../../glyph/glyph.js";
import GlyphInfo from "../glyph-info.js";
import type ShapingPlan from "../shaping-plan.js";
import DefaultShaper from "./default-shaper.js";
import { getShaperData } from "./init.js";

/**
 * This shaper is an implementation of the Universal Shaping Engine, which
 * uses Unicode data to shape a number of scripts without a dedicated shaping engine.
 * See https://www.microsoft.com/typography/OpenTypeDev/USE/intro.htm.
 */
export default class UniversalShaper extends DefaultShaper {
  static override zeroMarkWidths: typeof DefaultShaper.zeroMarkWidths = "BEFORE_GPOS";

  static override planFeatures(plan: ShapingPlan): void {
    plan.addStage(setupSyllables);

    // Default glyph pre-processing group
    plan.addStage(["locl", "ccmp", "nukt", "akhn"]);

    // Reordering group
    plan.addStage(clearSubstitutionFlags);
    plan.addStage(["rphf"], false);
    plan.addStage(recordRphf);
    plan.addStage(clearSubstitutionFlags);
    plan.addStage(["pref"]);
    plan.addStage(recordPref);

    // Orthographic unit shaping group
    plan.addStage(["rkrf", "abvf", "blwf", "half", "pstf", "vatu", "cjct"]);
    plan.addStage(reorder);

    // Topographical features
    // Scripts that need this are handled by the Arabic shaper, not implemented here for now.
    // plan.addStage(['isol', 'init', 'medi', 'fina', 'med2', 'fin2', 'fin3'], false);

    // Standard topographic presentation and positional feature application
    plan.addStage(["abvs", "blws", "pres", "psts", "dist", "abvm", "blwm"]);
  }

  static override assignFeatures(plan: ShapingPlan, glyphs: GlyphInfo[]): void {
    const { useDecompositions } = getShaperData();
    // Decompose split vowels. TODO: replace this with a general unicode normalizer.
    for (let i = glyphs.length - 1; i >= 0; i--) {
      const codepoint = glyphs[i].codePoints[0];
      if (codepoint == null) {
        continue;
      }

      const decomposition = useDecompositions[codepoint];
      if (!decomposition || decomposition.length === 0) {
        continue;
      }

      const decomposed = decomposition.map((cp) => {
        const glyph = plan.font.glyphForCodePoint(cp);
        return new GlyphInfo(plan.font, glyph.id, [cp], glyphs[i].features);
      });

      glyphs.splice(i, 1, ...decomposed);
    }
  }
}

function useCategory(glyph: GlyphInfo): number {
  const { useTrie } = getShaperData();
  const codePoint = glyph.codePoints[0] ?? 0;
  return useTrie.get(codePoint);
}

class USEInfo {
  category: string;
  syllableType: string;
  syllable: number;

  constructor(category: string, syllableType: string, syllable: number) {
    this.category = category;
    this.syllableType = syllableType;
    this.syllable = syllable;
  }
}

function setupSyllables(_font: FontLike, glyphs: GlyphInfo[]): void {
  const { useMachine, useCategories } = getShaperData();
  let syllable = 0;
  for (const [start, end, tags] of useMachine.match(glyphs.map(useCategory))) {
    syllable++;

    // Create shaper info
    for (let i = start; i <= end; i++) {
      const category = useCategories[useCategory(glyphs[i])] ?? "X";
      const syllableType = tags[0] ?? "";
      glyphs[i].shaperInfo = new USEInfo(category, syllableType, syllable);
    }

    const startInfo = getUseInfo(glyphs[start]);
    const limit = startInfo.category === "R" ? 1 : Math.min(3, end - start);
    for (let i = start; i < start + limit; i++) {
      glyphs[i].features.rphf = true;
    }
  }
}

function clearSubstitutionFlags(_font: FontLike, glyphs: GlyphInfo[]): void {
  for (const glyph of glyphs) {
    glyph.substituted = false;
  }
}

function recordRphf(_font: FontLike, glyphs: GlyphInfo[]): void {
  for (const glyph of glyphs) {
    if (glyph.substituted && glyph.features.rphf) {
      // Mark a substituted repha.
      getUseInfo(glyph).category = "R";
    }
  }
}

function recordPref(_font: FontLike, glyphs: GlyphInfo[]): void {
  for (const glyph of glyphs) {
    if (glyph.substituted) {
      // Mark a substituted pref as VPre, as they behave the same way.
      getUseInfo(glyph).category = "VPre";
    }
  }
}

function reorder(font: FontLike, glyphs: GlyphInfo[]): void {
  const dottedCircleGlyph = font.glyphForCodePoint(0x25cc);
  const dottedCircle = dottedCircleGlyph?.id;

  for (
    let start = 0, end = nextSyllable(glyphs, 0);
    start < glyphs.length;
    start = end, end = nextSyllable(glyphs, start)
  ) {
    let i: number;
    let j: number;
    let info = getUseInfo(glyphs[start]);
    const type = info.syllableType;

    // Only a few syllable types need reordering.
    if (
      type !== "virama_terminated_cluster" &&
      type !== "standard_cluster" &&
      type !== "broken_cluster"
    ) {
      continue;
    }

    // Insert a dotted circle glyph in broken clusters.
    if (type === "broken_cluster" && dottedCircle != null) {
      const g = new GlyphInfo(font, dottedCircle, [0x25cc]);
      g.shaperInfo = info;

      // Insert after possible Repha.
      for (i = start; i < end && getUseInfo(glyphs[i]).category === "R"; i++);
      glyphs.splice(++i, 0, g);
      end++;
    }

    // Move things forward.
    if (info.category === "R" && end - start > 1) {
      // Got a repha. Reorder it to after first base, before first halant.
      for (i = start + 1; i < end; i++) {
        info = getUseInfo(glyphs[i]);
        if (isBase(info) || isHalant(glyphs[i])) {
          // If we hit a halant, move before it; otherwise it's a base: move to its
          // place, and shift things in between backward.
          if (isHalant(glyphs[i])) {
            i--;
          }

          glyphs.splice(start, 0, ...glyphs.splice(start + 1, i - start), glyphs[i]);
          break;
        }
      }
    }

    // Move things back.
    for (i = start, j = end; i < end; i++) {
      info = getUseInfo(glyphs[i]);
      if (isBase(info) || isHalant(glyphs[i])) {
        // If we hit a halant, move after it; otherwise it's a base: move to its
        // place, and shift things in between backward.
        j = isHalant(glyphs[i]) ? i + 1 : i;
      } else if ((info.category === "VPre" || info.category === "VMPre") && j < i) {
        glyphs.splice(j, 1, glyphs[i], ...glyphs.splice(j, i - j));
      }
    }
  }
}

function nextSyllable(glyphs: GlyphInfo[], start: number): number {
  if (start >= glyphs.length) {
    return start;
  }

  const syllable = getUseInfo(glyphs[start]).syllable;
  while (++start < glyphs.length && getUseInfo(glyphs[start]).syllable === syllable);
  return start;
}

function getUseInfo(glyph: GlyphInfo): USEInfo {
  if (!glyph.shaperInfo) {
    throw new Error("Missing USE shaper info on glyph.");
  }

  return glyph.shaperInfo as USEInfo;
}

function isHalant(glyph: GlyphInfo): boolean {
  return getUseInfo(glyph).category === "H" && !glyph.isLigated;
}

function isBase(info: USEInfo): boolean {
  return info.category === "B" || info.category === "GB";
}
