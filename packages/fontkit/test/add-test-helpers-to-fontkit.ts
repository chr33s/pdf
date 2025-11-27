import fs from "node:fs";
import fontkit from "../src/index.js";

fontkit.logErrors = true;

type VariationSettings = Record<string, number>;
type FontSelector = string | VariationSettings | null | undefined;
type BaseFontInstance = Awaited<ReturnType<typeof fontkit.create>>;
export type FontInstance = BaseFontInstance & {
  setDefaultLanguage(lang?: string | null): void;
};

type FontkitWithHelpers = typeof fontkit & {
  open: (filename: string, postscriptName?: FontSelector) => Promise<FontInstance>;
};

const fontkitWithHelpers = fontkit as FontkitWithHelpers;

/**
 * Open a font file asynchronously.
 * This is the primary way to load fonts - initialization happens automatically.
 */
fontkitWithHelpers.open = async (filename, postscriptName) => {
  const buffer = await fs.promises.readFile(filename);
  return fontkitWithHelpers.create(buffer, postscriptName ?? undefined) as Promise<FontInstance>;
};

export default fontkitWithHelpers;
