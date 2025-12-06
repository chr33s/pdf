/**
 * Fontkit types for external consumers
 */

import type BBox from "./glyph/b-box.js";
import type GlyphClass from "./glyph/glyph.js";
import type GlyphPositionClass from "./layout/glyph-position.js";
import type GlyphRunClass from "./layout/glyph-run.js";
import type SubsetClass from "./subset/subset.js";

/**
 * Represents a glyph bounding box
 */
export type BoundingBox = BBox;

/**
 * Glyph objects represent a glyph in the font
 */
export type Glyph = GlyphClass;

/**
 * Represents a positioned glyph in a glyph run
 */
export type GlyphPosition = GlyphPositionClass;

/**
 * GlyphRun represents a run of laid out glyphs
 */
export type GlyphRun = GlyphRunClass;

/**
 * Subset represents a subset of a font
 */
export type Subset = SubsetClass;

/**
 * OpenType features that can be enabled/disabled
 */
export interface OpenTypeFeatures {
  aalt?: boolean;
  abvf?: boolean;
  abvm?: boolean;
  abvs?: boolean;
  afrc?: boolean;
  akhn?: boolean;
  blwf?: boolean;
  blwm?: boolean;
  blws?: boolean;
  calt?: boolean;
  case?: boolean;
  ccmp?: boolean;
  cfar?: boolean;
  cjct?: boolean;
  clig?: boolean;
  cpct?: boolean;
  cpsp?: boolean;
  cswh?: boolean;
  curs?: boolean;
  cv01?: boolean;
  cv02?: boolean;
  cv03?: boolean;
  cv04?: boolean;
  cv05?: boolean;
  cv06?: boolean;
  cv07?: boolean;
  cv08?: boolean;
  cv09?: boolean;
  cv10?: boolean;
  c2pc?: boolean;
  c2sc?: boolean;
  dist?: boolean;
  dlig?: boolean;
  dnom?: boolean;
  dtls?: boolean;
  expt?: boolean;
  falt?: boolean;
  fin2?: boolean;
  fin3?: boolean;
  fina?: boolean;
  flac?: boolean;
  frac?: boolean;
  fwid?: boolean;
  half?: boolean;
  haln?: boolean;
  halt?: boolean;
  hist?: boolean;
  hkna?: boolean;
  hlig?: boolean;
  hngl?: boolean;
  hojo?: boolean;
  hwid?: boolean;
  init?: boolean;
  isol?: boolean;
  ital?: boolean;
  jalt?: boolean;
  jp78?: boolean;
  jp83?: boolean;
  jp90?: boolean;
  jp04?: boolean;
  kern?: boolean;
  lfbd?: boolean;
  liga?: boolean;
  ljmo?: boolean;
  lnum?: boolean;
  locl?: boolean;
  ltra?: boolean;
  ltrm?: boolean;
  mark?: boolean;
  med2?: boolean;
  medi?: boolean;
  mgrk?: boolean;
  mkmk?: boolean;
  mset?: boolean;
  nalt?: boolean;
  nlck?: boolean;
  nukt?: boolean;
  numr?: boolean;
  onum?: boolean;
  opbd?: boolean;
  ordn?: boolean;
  ornm?: boolean;
  palt?: boolean;
  pcap?: boolean;
  pkna?: boolean;
  pnum?: boolean;
  pref?: boolean;
  pres?: boolean;
  pstf?: boolean;
  psts?: boolean;
  pwid?: boolean;
  qwid?: boolean;
  rand?: boolean;
  rclt?: boolean;
  rkrf?: boolean;
  rlig?: boolean;
  rphf?: boolean;
  rtbd?: boolean;
  rtla?: boolean;
  rtlm?: boolean;
  ruby?: boolean;
  rvrn?: boolean;
  salt?: boolean;
  sinf?: boolean;
  size?: boolean;
  smcp?: boolean;
  smpl?: boolean;
  ss01?: boolean;
  ss02?: boolean;
  ss03?: boolean;
  ss04?: boolean;
  ss05?: boolean;
  ss06?: boolean;
  ss07?: boolean;
  ss08?: boolean;
  ss09?: boolean;
  ss10?: boolean;
  ss11?: boolean;
  ss12?: boolean;
  ss13?: boolean;
  ss14?: boolean;
  ss15?: boolean;
  ss16?: boolean;
  ss17?: boolean;
  ss18?: boolean;
  ss19?: boolean;
  ss20?: boolean;
  ssty?: boolean;
  stch?: boolean;
  subs?: boolean;
  sups?: boolean;
  swsh?: boolean;
  titl?: boolean;
  tjmo?: boolean;
  tnam?: boolean;
  tnum?: boolean;
  trad?: boolean;
  twid?: boolean;
  unic?: boolean;
  valt?: boolean;
  vatu?: boolean;
  vert?: boolean;
  vhal?: boolean;
  vjmo?: boolean;
  vkna?: boolean;
  vkrn?: boolean;
  vpal?: boolean;
  vrt2?: boolean;
  vrtr?: boolean;
  zero?: boolean;
}

/**
 * AAT (Apple Advanced Typography) features
 */
export interface AATFeatures {
  allTypographicFeatures?: boolean;
  ligatures?: boolean;
  requiredLigatures?: boolean;
  commonLigatures?: boolean;
  rareLigatures?: boolean;
  logoLigatures?: boolean;
  rebusPictures?: boolean;
  diphthongLigatures?: boolean;
  squaredLigatures?: boolean;
  abbrevSquaredLigatures?: boolean;
  symbolLigatures?: boolean;
  contextualLigatures?: boolean;
  historicalLigatures?: boolean;
}

/**
 * Combined type features interface
 */
export interface TypeFeatures extends OpenTypeFeatures, AATFeatures {}

/**
 * Font represents a font loaded by fontkit
 */
export interface Font {
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
  bbox: BoundingBox;
  numGlyphs: number;
  characterSet: number[];
  availableFeatures: string[];
  cff: unknown;
  "OS/2"?: { sFamilyClass: number };
  head: { macStyle: { italic: boolean } };
  post: { isFixedPitch: boolean };
  glyphForCodePoint(codePoint: number): Glyph;
  hasGlyphForCodePoint(codePoint: number): boolean;
  glyphsForString(string: string): Glyph[];
  layout(
    string: string,
    features?: TypeFeatures | string[] | Record<string, boolean>,
  ): Promise<GlyphRun>;
  getGlyph(glyphId: number, codePoints?: number[]): Glyph;
  createSubset(): Subset;
}

/**
 * Fontkit registry interface for creating fonts
 */
export interface Fontkit {
  create(buffer: Uint8Array | ArrayBuffer, postscriptName?: string): Promise<Font>;
}
