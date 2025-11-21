import * as base64 from "base64-arraybuffer";
import fs from "mz/fs.js";
import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pako from "pako";

import {
  type ICharMetrics,
  parseCharMetricsSection,
} from "./parseCharacterMetrics.ts";
import {
  type IFontMetrics,
  parseFontMetricsSection,
} from "./parseFontMetrics.ts";
import { type IKernPair, parseKernPairsSection } from "./parseKernPairs.ts";

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
  const files = await fs.readdir(`${parentDir}/font_metrics`);
  const afmFiles = files.filter((name) => name.includes(".afm"));
  return afmFiles.map((name) => `${parentDir}/font_metrics/${name}`);
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

const copyFileToSrc = async (src: string) => {
  const fileName = basename(src);
  const dest = dirname(dirname(__dirname)) + "/src/" + fileName;
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
