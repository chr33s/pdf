import * as base64 from "base64-arraybuffer";
import fs from "mz/fs.js";
import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pako from "pako";

import {
  type ICharMetrics,
  parseCharMetricsSection,
} from "./parse-character-metrics.ts";
import {
  type IFontMetrics,
  parseFontMetricsSection,
} from "./parse-font-metrics.ts";
import { type IKernPair, parseKernPairsSection } from "./parse-kern-pairs.ts";

export interface IMetrics extends IFontMetrics {
  CharMetrics: ICharMetrics[];
  KernPairs: IKernPair[];
}

export const parseFontMetrics = (data: string): IMetrics => ({
  ...parseFontMetricsSection(data),
  CharMetrics: parseCharMetricsSection(data),
  KernPairs: parseKernPairsSection(data),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getAfmFilePaths = async () => {
  const parentDir = dirname(dirname(__dirname));
  const metricsDir = `${parentDir}/font-metrics`;
  const files = await fs.readdir(metricsDir);
  const afmFiles = files.filter((name) => name.includes(".afm"));
  return afmFiles.map((name) => `${metricsDir}/${name}`);
};

const textEncoder = new TextEncoder();

const compressJson = (json: string) => {
  const jsonBytes = textEncoder.encode(json);
  const compressed = pako.deflate(jsonBytes);
  const arrBuf = compressed.buffer.slice(
    compressed.byteOffset,
    compressed.byteOffset + compressed.byteLength,
  );
  const base64DeflatedJson = JSON.stringify(base64.encode(arrBuf));
  return base64DeflatedJson;
};

const fontFileNameMap: Record<string, string> = {
  "courier.compressed.json": "courier.compressed.json",
  "courier-bold.compressed.json": "courier-bold.compressed.json",
  "courier-oblique.compressed.json": "courier-oblique.compressed.json",
  "courier-bold-oblique.compressed.json":
    "courier-bold-oblique.compressed.json",
  "helvetica.compressed.json": "helvetica.compressed.json",
  "helvetica-bold.compressed.json": "helvetica-bold.compressed.json",
  "helvetica-oblique.compressed.json": "helvetica-oblique.compressed.json",
  "helvetica-bold-oblique.compressed.json":
    "helvetica-bold-oblique.compressed.json",
  "times-roman.compressed.json": "times-roman.compressed.json",
  "times-bold.compressed.json": "times-bold.compressed.json",
  "times-italic.compressed.json": "times-italic.compressed.json",
  "times-bold-italic.compressed.json": "times-bold-italic.compressed.json",
  "symbol.compressed.json": "symbol.compressed.json",
  "zapf-dingbats.compressed.json": "zapf-dingbats.compressed.json",
};

const copyFileToSrc = async (src: string) => {
  const fileName = basename(src);
  const canonicalFileName = fontFileNameMap[fileName] ?? fileName;
  const dest = `${dirname(dirname(__dirname))}/src/${canonicalFileName}`;
  await (fs.copyFile as any)(src, dest);
};

const main = async () => {
  const afmFiles = await getAfmFilePaths();

  for (const afmFile of afmFiles) {
    console.log("Parsing:", afmFile);
    const data = await fs.readFile(afmFile);

    const metrics = parseFontMetrics(String(data));
    const jsonMetrics = JSON.stringify(metrics);

    const jsonFile = afmFile.replace(".afm", ".json");
    const compressedJsonFile = afmFile.replace(".afm", ".compressed.json");

    await fs.writeFile(jsonFile, jsonMetrics);
    await fs.writeFile(compressedJsonFile, compressJson(jsonMetrics));
    await copyFileToSrc(compressedJsonFile);
  }
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
