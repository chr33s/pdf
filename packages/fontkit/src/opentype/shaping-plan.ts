import type { FontLike } from "../glyph/glyph.js";
import type GlyphPosition from "../layout/glyph-position.js";
import type GlyphInfo from "./glyph-info.js";
import type OTProcessor from "./ot-processor.js";

type Stage = string[] | StageCallback;
type StageCallback = (
  font: FontLike,
  glyphs: GlyphInfo[],
  plan: ShapingPlan,
) => void;

/**
 * ShapingPlans are used by the OpenType shapers to store which
 * features should by applied, and in what order to apply them.
 * The features are applied in groups called stages. A feature
 * can be applied globally to all glyphs, or locally to only
 * specific glyphs.
 *
 * @private
 */
export default class ShapingPlan {
  font: FontLike;
  script: string | string[] | null;
  direction: string;
  stages: Stage[];
  globalFeatures: Record<string, boolean>;
  allFeatures: Record<string, number>;

  constructor(
    font: FontLike,
    script: string | string[] | null,
    direction: string,
  ) {
    this.font = font;
    this.script = script;
    this.direction = direction;
    this.stages = [];
    this.globalFeatures = {};
    this.allFeatures = {};
  }
  /**
   * Adds the given features to the last stage.
   * Ignores features that have already been applied.
   */
  _addFeatures(features: string[], global: boolean): void {
    let stageIndex = this.stages.length - 1;
    let stage = this.stages[stageIndex];
    if (!Array.isArray(stage)) {
      stage = [];
      this.stages[stageIndex] = stage;
    }

    for (let feature of features) {
      if (this.allFeatures[feature] == null) {
        stage.push(feature);
        this.allFeatures[feature] = stageIndex;

        if (global) {
          this.globalFeatures[feature] = true;
        }
      }
    }
  }

  /**
   * Add features to the last stage
   */
  add(
    arg: string | string[] | { global?: string[]; local?: string[] },
    global = true,
  ): void {
    if (this.stages.length === 0) {
      this.stages.push([]);
    }

    const value = typeof arg === "string" ? [arg] : arg;

    if (Array.isArray(value)) {
      this._addFeatures(value, global);
    } else if (typeof value === "object" && value) {
      this._addFeatures(value.global || [], true);
      this._addFeatures(value.local || [], false);
    } else {
      throw new Error("Unsupported argument to ShapingPlan#add");
    }
  }

  /**
   * Add a new stage
   */
  addStage(
    arg:
      | string
      | string[]
      | { global?: string[]; local?: string[] }
      | StageCallback,
    global?: boolean,
  ): void {
    if (typeof arg === "function") {
      this.stages.push(arg);
      this.stages.push([]);
    } else {
      this.stages.push([]);
      this.add(arg, global);
    }
  }

  setFeatureOverrides(features?: string[] | Record<string, boolean>): void {
    if (Array.isArray(features)) {
      this.add(features);
    } else if (typeof features === "object" && features) {
      for (let tag in features) {
        if (features[tag]) {
          this.add(tag);
        } else if (this.allFeatures[tag] != null) {
          let stage = this.stages[this.allFeatures[tag]];
          if (Array.isArray(stage)) {
            stage.splice(stage.indexOf(tag), 1);
          }

          delete this.allFeatures[tag];
          delete this.globalFeatures[tag];
        }
      }
    }
  }

  /**
   * Assigns the global features to the given glyphs
   */
  assignGlobalFeatures(glyphs: GlyphInfo[]): void {
    for (let glyph of glyphs) {
      for (let feature in this.globalFeatures) {
        glyph.features[feature] = true;
      }
    }
  }

  /**
   * Executes the planned stages using the given OTProcessor
   */
  process(
    processor: OTProcessor,
    glyphs: GlyphInfo[],
    positions?: GlyphPosition[] | null,
  ): void {
    for (let stage of this.stages) {
      if (typeof stage === "function") {
        if (!positions) {
          stage(this.font, glyphs, this);
        }
      } else if (stage.length > 0) {
        processor.applyFeatures(stage, glyphs, positions ?? undefined);
      }
    }
  }
}
