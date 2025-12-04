import * as base64 from "@chr33s/base64";
import { inflate } from "@chr33s/compression";
import UnicodeTrie from "@chr33s/unicode-trie";

import base64DeflatedData from "./data.js";
import base64DeflatedTrie from "./trie.js";

type UnicodeDataset = {
  categories: string[];
  combiningClasses: string[];
  scripts: string[];
  eaw: string[];
};

export type PropertyAccessor = (codePoint: number) => string;
export type NumericAccessor = (codePoint: number) => number | null;
export type PropertyPredicate = (codePoint: number) => boolean;

const decodeBase64 = (encoded: string): Uint8Array => new Uint8Array(base64.decode(encoded));

const textDecoder = new TextDecoder();
const inflateJson = async <T>(encoded: string): Promise<T> =>
  JSON.parse(textDecoder.decode(await inflate(decodeBase64(encoded))));

const inflateBinary = (encoded: string): Promise<Uint8Array> => inflate(decodeBase64(encoded));

const log2 = (value: number): number => Math.log2?.(value) ?? Math.log(value) / Math.LN2;
const bits = (value: number): number => (value > 0 ? (log2(value) + 1) | 0 : 0);

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

// Singleton instance and initialization promise
let instance: UnicodePropertiesAPI | null = null;
let initPromise: Promise<UnicodePropertiesAPI> | null = null;

/**
 * Creates a UnicodeProperties instance asynchronously.
 * Uses cached singleton after first initialization.
 */
export async function createUnicodeProperties(): Promise<UnicodePropertiesAPI> {
  if (instance) return instance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const encodedData = base64DeflatedData as string;
    const encodedTrie = base64DeflatedTrie as string;

    const [data, trieData] = await Promise.all([
      inflateJson<UnicodeDataset>(encodedData),
      inflateBinary(encodedTrie),
    ]);

    const trie = await UnicodeTrie.create(trieData);

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

    const isDigit: PropertyPredicate = (codePoint) => getCategory(codePoint) === "Nd";

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

    const isLowerCase: PropertyPredicate = (codePoint) => getCategory(codePoint) === "Ll";

    const isUpperCase: PropertyPredicate = (codePoint) => getCategory(codePoint) === "Lu";

    const isTitleCase: PropertyPredicate = (codePoint) => getCategory(codePoint) === "Lt";

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

    instance = {
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

    return instance;
  })();

  return initPromise;
}

/**
 * Checks if unicode-properties has been initialized.
 */
export function isInitialized(): boolean {
  return instance !== null;
}

/**
 * Gets the initialized instance. Throws if not initialized.
 * Use this after calling createUnicodeProperties().
 */
export function getUnicodeProperties(): UnicodePropertiesAPI {
  if (!instance) {
    throw new Error(
      "unicode-properties not initialized. Call createUnicodeProperties() first and await its result.",
    );
  }
  return instance;
}

/**
 * Proxy object that provides sync access to unicode-properties after initialization.
 * Will throw if accessed before createUnicodeProperties() resolves.
 */
export const unicode: UnicodePropertiesAPI = new Proxy({} as UnicodePropertiesAPI, {
  get(_target, prop: keyof UnicodePropertiesAPI) {
    if (!instance) {
      throw new Error(
        `unicode-properties not initialized. Call createUnicodeProperties() first before accessing '${String(prop)}'.`,
      );
    }
    return instance[prop];
  },
});

export default createUnicodeProperties;
