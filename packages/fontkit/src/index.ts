import fontkit from "./base.js";
import DFont from "./d-font.js";
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

export default fontkit;
