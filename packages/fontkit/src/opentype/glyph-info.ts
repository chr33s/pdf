import unicode from "@chr33s/unicode-properties";
import type { FontLike } from "../glyph/glyph.js";
import OTProcessor from "./ot-processor.js";

type GlyphFeatureMap = Record<string, boolean>;
type FeatureInit = string[] | GlyphFeatureMap | undefined;

export default class GlyphInfo {
  _font: FontLike;
  codePoints: number[];
  private _id!: number;
  features: GlyphFeatureMap;
  ligatureID: number | null;
  ligatureComponent: number | null;
  isLigated: boolean;
  cursiveAttachment: number | null;
  markAttachment: number | null;
  shaperInfo: any;
  substituted: boolean;
  isMultiplied: boolean;
  markAttachmentType!: number;
  isBase!: boolean;
  isLigature!: boolean;
  isMark!: boolean;

  constructor(
    font: FontLike,
    id: number,
    codePoints: number[] = [],
    features?: FeatureInit,
  ) {
    this._font = font;
    this.codePoints = codePoints;

    this.features = {};
    if (Array.isArray(features)) {
      for (let i = 0; i < features.length; i++) {
        let feature = features[i];
        this.features[feature] = true;
      }
    } else if (typeof features === "object" && features != null) {
      Object.assign(this.features, features);
    }

    this.ligatureID = null;
    this.ligatureComponent = null;
    this.isLigated = false;
    this.cursiveAttachment = null;
    this.markAttachment = null;
    this.shaperInfo = null;
    this.substituted = false;
    this.isMultiplied = false;

    // Set id last since the setter computes isBase, isLigature, isMark, markAttachmentType
    this.id = id;
  }

  get id(): number {
    return this._id;
  }

  set id(id: number) {
    this._id = id;
    this.substituted = true;

    let GDEF = this._font.GDEF;
    if (GDEF && GDEF.glyphClassDef) {
      // TODO: clean this up
      let classID = OTProcessor.prototype.getClassID(id, GDEF.glyphClassDef);
      this.isBase = classID === 1;
      this.isLigature = classID === 2;
      this.isMark = classID === 3;
      this.markAttachmentType = GDEF.markAttachClassDef
        ? OTProcessor.prototype.getClassID(id, GDEF.markAttachClassDef)
        : 0;
    } else {
      this.isMark =
        this.codePoints.length > 0 && this.codePoints.every(unicode.isMark);
      this.isBase = !this.isMark;
      this.isLigature = this.codePoints.length > 1;
      this.markAttachmentType = 0;
    }
  }

  copy(): GlyphInfo {
    return new GlyphInfo(this._font, this.id, this.codePoints, this.features);
  }
}
