import UnicodeTrie from "unicode-trie";
import pako from "pako";
import * as base64 from "base64-arraybuffer";

import base64DeflatedData from "./data.json" with { type: "json" };
import base64DeflatedTrie from "./trie.json" with { type: "json" };

type UnicodeDataset = {
  categories: string[];
  combiningClasses: string[];
  scripts: string[];
  eaw: string[];
};

type PropertyAccessor = (codePoint: number) => string;
type NumericAccessor = (codePoint: number) => number | null;
type PropertyPredicate = (codePoint: number) => boolean;

const decodeBase64 = (encoded: string): Uint8Array =>
  new Uint8Array(base64.decode(encoded));

const inflateJson = <T>(encoded: string): T =>
  JSON.parse(pako.inflate(decodeBase64(encoded), { to: "string" }) as string);

const inflateBinary = (encoded: string): Uint8Array =>
  pako.inflate(decodeBase64(encoded));

const encodedData = base64DeflatedData as string;
const encodedTrie = base64DeflatedTrie as string;

const data: UnicodeDataset = inflateJson<UnicodeDataset>(encodedData);
const trieData = inflateBinary(encodedTrie);
const trie = new UnicodeTrie(trieData);

const log2 = (value: number): number =>
  Math.log2?.(value) ?? Math.log(value) / Math.LN2;
const bits = (value: number): number => (value > 0 ? (log2(value) + 1) | 0 : 0);

// compute the number of bits stored for each field
const CATEGORY_BITS = bits(data.categories.length - 1);
const COMBINING_BITS = bits(data.combiningClasses.length - 1);
const SCRIPT_BITS = bits(data.scripts.length - 1);
const EAW_BITS = bits(data.eaw.length - 1);
const NUMBER_BITS = 10;

// compute shift and mask values for each field
const CATEGORY_SHIFT = COMBINING_BITS + SCRIPT_BITS + EAW_BITS + NUMBER_BITS;
const COMBINING_SHIFT = SCRIPT_BITS + EAW_BITS + NUMBER_BITS;
const SCRIPT_SHIFT = EAW_BITS + NUMBER_BITS;
const EAW_SHIFT = NUMBER_BITS;
const CATEGORY_MASK = (1 << CATEGORY_BITS) - 1;
const COMBINING_MASK = (1 << COMBINING_BITS) - 1;
const SCRIPT_MASK = (1 << SCRIPT_BITS) - 1;
const EAW_MASK = (1 << EAW_BITS) - 1;
const NUMBER_MASK = (1 << NUMBER_BITS) - 1;

const getCategory: PropertyAccessor = (codePoint) => {
  const val = trie.get(codePoint);
  return data.categories[(val >> CATEGORY_SHIFT) & CATEGORY_MASK];
};

const getCombiningClass: PropertyAccessor = (codePoint) => {
  const val = trie.get(codePoint);
  return data.combiningClasses[(val >> COMBINING_SHIFT) & COMBINING_MASK];
};

const getScript: PropertyAccessor = (codePoint) => {
  const val = trie.get(codePoint);
  return data.scripts[(val >> SCRIPT_SHIFT) & SCRIPT_MASK];
};

const getEastAsianWidth: PropertyAccessor = (codePoint) => {
  const val = trie.get(codePoint);
  return data.eaw[(val >> EAW_SHIFT) & EAW_MASK];
};

const getNumericValue: NumericAccessor = (codePoint) => {
  let val = trie.get(codePoint);
  let num = val & NUMBER_MASK;

  if (num === 0) {
    return null;
  }

  if (num <= 50) {
    return num - 1;
  }

  if (num < 0x1e0) {
    const numerator = (num >> 4) - 12;
    const denominator = (num & 0xf) + 1;
    return numerator / denominator;
  }

  if (num < 0x300) {
    val = (num >> 5) - 14;
    let exp = (num & 0x1f) + 2;

    while (exp > 0) {
      val *= 10;
      exp--;
    }
    return val;
  }

  val = (num >> 2) - 0xbf;
  let exp = (num & 3) + 1;
  while (exp > 0) {
    val *= 60;
    exp--;
  }
  return val;
};

const isAlphabetic: PropertyPredicate = (codePoint) => {
  const category = getCategory(codePoint);
  return (
    category === "Lu" ||
    category === "Ll" ||
    category === "Lt" ||
    category === "Lm" ||
    category === "Lo" ||
    category === "Nl"
  );
};

const isDigit: PropertyPredicate = (codePoint) =>
  getCategory(codePoint) === "Nd";

const isPunctuation: PropertyPredicate = (codePoint) => {
  const category = getCategory(codePoint);
  return (
    category === "Pc" ||
    category === "Pd" ||
    category === "Pe" ||
    category === "Pf" ||
    category === "Pi" ||
    category === "Po" ||
    category === "Ps"
  );
};

const isLowerCase: PropertyPredicate = (codePoint) =>
  getCategory(codePoint) === "Ll";

const isUpperCase: PropertyPredicate = (codePoint) =>
  getCategory(codePoint) === "Lu";

const isTitleCase: PropertyPredicate = (codePoint) =>
  getCategory(codePoint) === "Lt";

const isWhiteSpace: PropertyPredicate = (codePoint) => {
  const category = getCategory(codePoint);
  return category === "Zs" || category === "Zl" || category === "Zp";
};

const isBaseForm: PropertyPredicate = (codePoint) => {
  const category = getCategory(codePoint);
  return (
    category === "Nd" ||
    category === "No" ||
    category === "Nl" ||
    category === "Lu" ||
    category === "Ll" ||
    category === "Lt" ||
    category === "Lm" ||
    category === "Lo" ||
    category === "Me" ||
    category === "Mc"
  );
};

const isMark: PropertyPredicate = (codePoint) => {
  const category = getCategory(codePoint);
  return category === "Mn" || category === "Me" || category === "Mc";
};

export type UnicodePropertiesAPI = {
  getCategory: PropertyAccessor;
  getCombiningClass: PropertyAccessor;
  getScript: PropertyAccessor;
  getEastAsianWidth: PropertyAccessor;
  getNumericValue: NumericAccessor;
  isAlphabetic: PropertyPredicate;
  isDigit: PropertyPredicate;
  isPunctuation: PropertyPredicate;
  isLowerCase: PropertyPredicate;
  isUpperCase: PropertyPredicate;
  isTitleCase: PropertyPredicate;
  isWhiteSpace: PropertyPredicate;
  isBaseForm: PropertyPredicate;
  isMark: PropertyPredicate;
};

export const unicodeProperties: UnicodePropertiesAPI = {
  getCategory,
  getCombiningClass,
  getScript,
  getEastAsianWidth,
  getNumericValue,
  isAlphabetic,
  isDigit,
  isPunctuation,
  isLowerCase,
  isUpperCase,
  isTitleCase,
  isWhiteSpace,
  isBaseForm,
  isMark,
};

export {
  getCategory,
  getCombiningClass,
  getScript,
  getEastAsianWidth,
  getNumericValue,
  isAlphabetic,
  isDigit,
  isPunctuation,
  isLowerCase,
  isUpperCase,
  isTitleCase,
  isWhiteSpace,
  isBaseForm,
  isMark,
};

export default unicodeProperties;
