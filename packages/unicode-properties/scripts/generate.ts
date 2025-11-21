import base64 from "base64-arraybuffer";
import codePoints from "codepoints";
import { writeFileSync } from "node:fs";
import path from "node:path";
import pako from "pako";
import UnicodeTrieBuilder from "unicode-trie/builder.js";

type IndexLookup = Record<string, number>;

const bits = (value: number): number =>
  value > 0 ? (Math.log2(value) + 1) | 0 : 0;

const numericValue = (numeric?: string): number => {
  if (!numeric) {
    return 0;
  }

  const fractionMatch = numeric.match(/^(-?\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10);
    const denominator = parseInt(fractionMatch[2], 10);
    return ((numerator + 12) << 4) + (denominator - 1);
  }

  if (/^\d0+$/.test(numeric)) {
    const mantissa = parseInt(numeric[0]!, 10);
    const exponent = numeric.length - 1;
    return ((mantissa + 14) << 5) + (exponent - 2);
  }

  const value = parseInt(numeric, 10);
  if (value <= 50) {
    return 1 + value;
  }

  let mantissa = value;
  let exponent = 0;
  while (mantissa % 60 === 0) {
    mantissa /= 60;
    exponent += 1;
  }

  return ((mantissa + 0xbf) << 2) + (exponent - 1);
};

const addIndex = (
  lookup: IndexLookup,
  key: string | undefined,
  currentCount: number,
): number => {
  const normalizedKey = key ?? "";
  if (lookup[normalizedKey] == null) {
    lookup[normalizedKey] = currentCount;
    return currentCount + 1;
  }
  return currentCount;
};

const getIndex = (lookup: IndexLookup, key: string | undefined): number =>
  lookup[key ?? ""] ?? 0;

const srcDir = path.resolve(process.cwd(), "src");
const trieFilePath = path.join(srcDir, "trie.json");
const dataFilePath = path.join(srcDir, "data.json");

const categories: IndexLookup = Object.create(null);
const combiningClasses: IndexLookup = Object.create(null);
const scripts: IndexLookup = Object.create(null);
const eaws: IndexLookup = Object.create(null);

let categoryCount = 0;
let combiningClassCount = 0;
let scriptCount = 0;
let eawCount = 0;

const entries = Array.from(codePoints);

for (const entry of entries) {
  if (!entry) {
    continue;
  }

  categoryCount = addIndex(categories, entry.category, categoryCount);
  combiningClassCount = addIndex(
    combiningClasses,
    entry.combiningClassName,
    combiningClassCount,
  );
  scriptCount = addIndex(scripts, entry.script, scriptCount);
  eawCount = addIndex(eaws, entry.eastAsianWidth, eawCount);
}

const numberBits = 10;
const combiningClassBits = bits(combiningClassCount - 1);
const scriptBits = bits(scriptCount - 1);
const eawBits = bits(eawCount - 1);

const categoryShift = combiningClassBits + scriptBits + eawBits + numberBits;
const combiningShift = scriptBits + eawBits + numberBits;
const scriptShift = eawBits + numberBits;
const eawShift = numberBits;

const trie = new UnicodeTrieBuilder();
for (const entry of entries) {
  if (!entry) {
    continue;
  }

  const category = getIndex(categories, entry.category);
  const combiningClass = getIndex(combiningClasses, entry.combiningClassName);
  const script = getIndex(scripts, entry.script);
  const eaw = getIndex(eaws, entry.eastAsianWidth);
  const numeric = numericValue(entry.numeric);

  const val =
    (category << categoryShift) |
    (combiningClass << combiningShift) |
    (script << scriptShift) |
    (eaw << eawShift) |
    numeric;

  trie.set(entry.code, val);
}

const trieBuffer = trie.toBuffer();
const triePayload = JSON.stringify(base64.encode(pako.deflate(trieBuffer)));
writeFileSync(trieFilePath, triePayload);

const encoder = new TextEncoder();
const data = {
  categories: Object.keys(categories),
  combiningClasses: Object.keys(combiningClasses),
  scripts: Object.keys(scripts),
  eaw: Object.keys(eaws),
};

const dataBytes = encoder.encode(JSON.stringify(data));
const dataPayload = JSON.stringify(base64.encode(pako.deflate(dataBytes)));
writeFileSync(dataFilePath, dataPayload);
