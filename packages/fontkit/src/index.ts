import fontkit, { setInitializer } from "./base.js";
import DFont from "./d-font.js";
import { initShapers } from "./opentype/shapers/init.js";
import TrueTypeCollection from "./true-type-collection.js";
import TTFFont from "./ttf-font.js";
import WOFFFont from "./woff-font.js";
import WOFF2Font from "./woff2-font.js";

// Re-export types for consumers
export type { FontInstance, FontkitRegistry } from "./base.js";
export type { default as Glyph } from "./glyph/glyph.js";
export type { default as GlyphRun } from "./layout/glyph-run.js";
export type { default as Subset } from "./subset/subset.js";
export type {
  AATFeatures,
  BoundingBox,
  Font,
  Fontkit,
  GlyphPosition,
  OpenTypeFeatures,
  TypeFeatures,
} from "./types.js";

// Register font formats
fontkit.registerFormat(TTFFont);
fontkit.registerFormat(WOFFFont);
fontkit.registerFormat(WOFF2Font);
fontkit.registerFormat(TrueTypeCollection as any);
fontkit.registerFormat(DFont as any);

// Set up auto-initialization - shapers will be initialized on first font create
setInitializer(initShapers);

export default fontkit;
