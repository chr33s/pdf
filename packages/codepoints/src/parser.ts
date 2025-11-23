import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const defaultUcdPath = resolve(moduleDir, "..", "data");

export type CodePointRange = [number, number];

export interface CodePoint {
  code: number;
  name: string;
  unicode1Name: string | null;
  isoComment: string | null;
  category: string;
  block: string | null;
  script: string | null;
  eastAsianWidth: string | null;
  combiningClass: number;
  combiningClassName: string | null;
  bidiClass: string;
  bidiMirrored: boolean;
  numeric: string | null;
  uppercase: number[] | null;
  lowercase: number[] | null;
  titlecase: number[] | null;
  folded: number[] | null;
  caseConditions: string[] | null;
  decomposition: number[];
  compositions: Record<number, number>;
  isCompat: boolean;
  isExcluded: boolean;
  joiningType: string | null;
  joiningGroup: string | null;
  indicSyllabicCategory: string | null;
  indicPositionalCategory: string | null;
  NFD_QC: number;
  NFKD_QC: number;
  NFC_QC: number;
  NFKC_QC: number;
}

export type CodePointTable = Array<CodePoint | undefined>;

const COMMENT_PATTERN = /\s*#.*$/;

const RANGE_PATTERN = /([a-f0-9]+)\.\.([a-f0-9]+)/i;

function parseCodes(code: string | undefined): number[] | null {
  if (!code) {
    return null;
  }

  return code
    .split(" ")
    .filter((segment) => segment.length > 0)
    .map((segment) => parseInt(segment, 16));
}

function createCodePoint(parts: string[]): CodePoint {
  const [
    codeHex,
    name,
    category,
    combiningClassValue,
    bidiClass,
    decompositionRaw,
    decimal,
    digit,
    numeric,
    bidiMirroredFlag,
    unicode1Name,
    isoComment,
    uppercaseHex,
    lowercaseHex,
    titlecaseHex,
  ] = parts;

  const decomposition = parseCodes(decompositionRaw) ?? [];

  const codePoint: CodePoint = {
    code: parseInt(codeHex, 16),
    name,
    unicode1Name: unicode1Name || null,
    isoComment: isoComment || null,
    category,
    block: null,
    script: null,
    eastAsianWidth: null,
    combiningClass: parseInt(combiningClassValue, 10) || 0,
    combiningClassName: null,
    bidiClass,
    bidiMirrored: bidiMirroredFlag === "Y",
    numeric: numeric || null,
    uppercase: uppercaseHex ? [parseInt(uppercaseHex, 16)] : null,
    lowercase: lowercaseHex ? [parseInt(lowercaseHex, 16)] : null,
    titlecase: titlecaseHex ? [parseInt(titlecaseHex, 16)] : null,
    folded: null,
    caseConditions: null,
    decomposition,
    compositions: {},
    isCompat: false,
    isExcluded: false,
    joiningType: null,
    joiningGroup: null,
    indicSyllabicCategory: null,
    indicPositionalCategory: null,
    NFD_QC: 0,
    NFKD_QC: 0,
    NFC_QC: 0,
    NFKC_QC: 0,
  };

  if (
    codePoint.decomposition.length &&
    Number.isNaN(codePoint.decomposition[0])
  ) {
    codePoint.isCompat = true;
    codePoint.decomposition.shift();
  }

  if (
    (decimal && decimal !== codePoint.numeric) ||
    (digit && digit !== codePoint.numeric)
  ) {
    throw new Error("Decimal or digit does not match numeric value");
  }

  return codePoint;
}

function cloneCodePoint(source: CodePoint, code: number): CodePoint {
  return { ...source, code };
}

function readRangeFile(
  ucdPath: string,
  filename: string,
  handler: (parts: [CodePointRange, ...string[]]) => void,
): void {
  const data = readFileSync(join(ucdPath, filename), "ascii");

  for (const rawLine of data.split("\n")) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    line = line.replace(COMMENT_PATTERN, "");
    if (!line) {
      continue;
    }

    const parts = line.split(/\s*;\s*/);

    const match = parts[0].match(RANGE_PATTERN);
    let range: CodePointRange | null = null;

    if (match) {
      range = [parseInt(match[1], 16), parseInt(match[2], 16)];
    } else {
      const value = parseInt(parts[0], 16);
      if (!Number.isNaN(value)) {
        range = [value, value];
      }
    }

    if (!range) {
      continue;
    }

    const rest = parts.slice(1) as string[];
    handler([range, ...rest]);
  }
}

function readRawFile(
  ucdPath: string,
  filename: string,
  handler: (parts: string[]) => void,
): void {
  const data = readFileSync(join(ucdPath, filename), "ascii");

  for (const rawLine of data.split("\n")) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    line = line.replace(COMMENT_PATTERN, "");
    if (!line) {
      continue;
    }

    handler(line.split(/\s*;\s*/));
  }
}

export default function loadCodePoints(
  ucdPath: string = defaultUcdPath,
): CodePointTable {
  const codePoints: CodePointTable = [];

  const unicodeData = readFileSync(join(ucdPath, "UnicodeData.txt"), "ascii");

  let rangeStart = -1;

  for (const line of unicodeData.split("\n")) {
    if (!line.length) {
      continue;
    }

    const parts = line.split(";");
    const name = parts[1];
    const codePoint = createCodePoint(parts);

    if (rangeStart >= 0) {
      if (!/<.+, Last>/.test(name)) {
        throw new Error("No range end found");
      }

      for (let code = rangeStart; code <= codePoint.code; code += 1) {
        codePoints[code] = cloneCodePoint(codePoint, code);
      }

      rangeStart = -1;
      continue;
    }

    if (/<.+, First>/.test(name)) {
      rangeStart = codePoint.code;
    } else {
      codePoints[codePoint.code] = codePoint;
    }
  }

  readRangeFile(ucdPath, "extracted/DerivedNumericValues.txt", (parts) => {
    const [start, end] = parts[0];
    const value = parts[3];

    for (let code = start; code <= end; code += 1) {
      const codePoint = codePoints[code];
      if (codePoint && !codePoint.numeric) {
        codePoint.numeric = value;
      }
    }
  });

  const combiningClasses: Record<number, string> = {};
  const joiningTypes: Record<string, string> = {};

  readRawFile(ucdPath, "PropertyValueAliases.txt", (parts) => {
    if (parts[0] === "ccc") {
      const num = parseInt(parts[1], 10);
      const name = parts[3];
      combiningClasses[num] = name;
    }

    if (parts[0] === "jt") {
      joiningTypes[parts[1]] = parts[2];
    }
  });

  for (const codePoint of codePoints) {
    if (codePoint) {
      codePoint.combiningClassName =
        combiningClasses[codePoint.combiningClass] ?? null;
    }
  }

  readRangeFile(ucdPath, "Blocks.txt", (parts) => {
    const [start, end] = parts[0];

    for (let code = start; code <= end; code += 1) {
      const codePoint = codePoints[code];
      if (codePoint) {
        codePoint.block = parts[1];
      }
    }
  });

  readRangeFile(ucdPath, "Scripts.txt", (parts) => {
    const [start, end] = parts[0];

    for (let code = start; code <= end; code += 1) {
      const codePoint = codePoints[code];
      if (codePoint) {
        codePoint.script = parts[1];
      }
    }
  });

  readRangeFile(ucdPath, "EastAsianWidth.txt", (parts) => {
    const [start, end] = parts[0];

    for (let code = start; code <= end; code += 1) {
      const codePoint = codePoints[code];
      if (codePoint) {
        codePoint.eastAsianWidth = parts[1];
      }
    }
  });

  readRangeFile(ucdPath, "SpecialCasing.txt", (parts) => {
    const [start] = parts[0];
    const lower = parseCodes(parts[1]);
    const title = parseCodes(parts[2]);
    const upper = parseCodes(parts[3]);
    const conditions = parts[4] ? parts[4].split(/\s+/) : null;

    const codePoint = codePoints[start];
    if (!codePoint) {
      return;
    }

    if (!conditions) {
      codePoint.uppercase = upper;
      codePoint.lowercase = lower;
      codePoint.titlecase = title;
    } else {
      codePoint.caseConditions = conditions;
    }
  });

  readRangeFile(ucdPath, "CaseFolding.txt", (parts) => {
    const [start] = parts[0];
    const type = parts[1];
    const folded = parseCodes(parts[2]) ?? [];

    if (["C", "F"].includes(type)) {
      const codePoint = codePoints[start];
      if (!codePoint) {
        return;
      }

      const lowercase = codePoint.lowercase?.join("|") ?? "";
      const foldedStr = folded.join("|");
      if (lowercase !== foldedStr) {
        codePoint.folded = folded;
      }
    }
  });

  readRangeFile(ucdPath, "CompositionExclusions.txt", (parts) => {
    const [start] = parts[0];
    const codePoint = codePoints[start];
    if (codePoint) {
      codePoint.isExcluded = true;
    }
  });

  readRangeFile(ucdPath, "DerivedNormalizationProps.txt", (parts) => {
    const [start, end] = parts[0];
    const prop = parts[1];
    const value = parts[2];

    if (["NFD_QC", "NFKD_QC", "NFC_QC", "NFKC_QC"].includes(prop)) {
      const quickCheckValue = value === "Y" ? 0 : value === "N" ? 1 : 2;

      for (let code = start; code <= end; code += 1) {
        const codePoint = codePoints[code];
        if (!codePoint) {
          continue;
        }

        switch (prop) {
          case "NFD_QC":
            codePoint.NFD_QC = quickCheckValue;
            break;
          case "NFKD_QC":
            codePoint.NFKD_QC = quickCheckValue;
            break;
          case "NFC_QC":
            codePoint.NFC_QC = quickCheckValue;
            break;
          case "NFKC_QC":
            codePoint.NFKC_QC = quickCheckValue;
            break;
          default:
            break;
        }
      }
    }
  });

  readRangeFile(ucdPath, "ArabicShaping.txt", (parts) => {
    const [start, end] = parts[0];
    const joiningType = parts[2];
    const joiningGroup = parts[3];

    for (let code = start; code <= end; code += 1) {
      const codePoint = codePoints[code];
      if (!codePoint) {
        continue;
      }

      codePoint.joiningType = joiningTypes[joiningType] ?? null;
      codePoint.joiningGroup = joiningGroup || null;
    }
  });

  readRangeFile(ucdPath, "IndicPositionalCategory.txt", (parts) => {
    const [start, end] = parts[0];
    const prop = parts[1];

    for (let code = start; code <= end; code += 1) {
      const codePoint = codePoints[code];
      if (codePoint) {
        codePoint.indicPositionalCategory = prop;
      }
    }
  });

  readRangeFile(ucdPath, "IndicSyllabicCategory.txt", (parts) => {
    const [start, end] = parts[0];
    const prop = parts[1];

    for (let code = start; code <= end; code += 1) {
      const codePoint = codePoints[code];
      if (codePoint) {
        codePoint.indicSyllabicCategory = prop;
      }
    }
  });

  for (const codePoint of codePoints) {
    if (
      codePoint &&
      codePoint.decomposition.length > 1 &&
      !codePoint.isCompat &&
      !codePoint.isExcluded
    ) {
      const base = codePoints[codePoint.decomposition[1]];
      if (base) {
        base.compositions[codePoint.decomposition[0]] = codePoint.code;
      }
    }
  }

  return codePoints;
}
