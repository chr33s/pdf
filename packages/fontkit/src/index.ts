import fontkit, { setInitializer } from "./base.js";
import DFont from "./d-font.js";
import { initShapers, isInitialized as isShapersInitialized } from "./opentype/shapers/init.js";
import TrueTypeCollection from "./true-type-collection.js";
import TTFFont from "./ttf-font.js";
import WOFFFont from "./woff-font.js";
import WOFF2Font from "./woff2-font.js";

// Register font formats
fontkit.registerFormat(TTFFont);
fontkit.registerFormat(WOFFFont);
fontkit.registerFormat(WOFF2Font);
fontkit.registerFormat(TrueTypeCollection as any);
fontkit.registerFormat(DFont as any);

// Set up auto-initialization - shapers will be initialized on first font create
setInitializer(initShapers);

/**
 * Check if fontkit's async resources have been initialized.
 * With the new async API, this is mostly informational since
 * initialization happens automatically on first use.
 */
export function isInitialized(): boolean {
  return isShapersInitialized();
}

export default fontkit;
