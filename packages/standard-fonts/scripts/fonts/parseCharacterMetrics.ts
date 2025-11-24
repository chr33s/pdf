import {
  error,
  extractLinesFromSection,
  takeAfterFirstSpace,
  takeUntilFirstSpace,
} from "./utils.ts";

export interface ICharMetrics {
  WX: number;
  N: string;
}

/**
 * From https://www.adobe.com/content/dam/acom/en/devnet/font/pdfs/5004.AFM_Spec.pdf :
 *
 * C integer:
 *   Decimal value of default character code (−1 if not encoded).
 *
 * WX number:
 *   Width of character.
 *
 * N name:
 *   (Optional.) PostScript language character name.
 *
 * B llx lly urx ury:
 *   (Optional.) Character bounding box where llx, lly, urx, and ury are all
 *   numbers. If a character makes no marks on the page (for example, the space
 *   character), this fi eld reads B 0 0 0 0 , and these values are not
 *   considered when computing the FontBBox.
 *
 * L successor ligature:
 *   (Optional.) Ligature sequence where successor and ligature are both names.
 *   The current character may join with the character named successor to form
 *   the character named ligature. Note that characters can have more than one
 *   such entry.
 *
 * Fallback link for AFM Spec:
 *   https://ia800603.us.archive.org/30/items/afm-format/afm-format.pdf
 */

// prettier-ignore
const parseCharMetrics = (
  // E.g. 'C 35 ; WX 600 ; N numbersign ; B 56 -45 544 651 ;'
  line: string,
): ICharMetrics => {
  const SEMICOLON_WITH_SURROUDING_WHITESPACE = /\s*;\s*/;
  const segments = line
    .split(SEMICOLON_WITH_SURROUDING_WHITESPACE)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  const metrics = new Map<string, string>();
  for (const metric of segments) {
    const key = takeUntilFirstSpace(metric);
    const value = takeAfterFirstSpace(metric);
    metrics.set(key, value);
  }

  const rawWx = metrics.get("WX") ?? error("Missing WX metric in character data");
  const rawName = metrics.get("N") ?? error("Missing N metric in character data");

  return {
    WX: Number(rawWx),
    N: rawName,
  };
};

export const parseCharMetricsSection = (data: string): ICharMetrics[] => {
  return extractLinesFromSection(data, {
    startAt: "StartCharMetrics",
    endAt: "EndCharMetrics",
  }).map(parseCharMetrics);
};
