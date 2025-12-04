import { deflate } from "@chr33s/compression";
import * as base64 from "base64-arraybuffer";
import fs from "mz/fs.js";
import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { EncodingMap } from "./parse-win1252.ts";
import { parseWin1252 } from "./parse-win1252.ts";
import { parseZapfDingbatsOrSymbol } from "./parse-zapf-dingbats-or-symbol.ts";

const textEncoder = new TextEncoder();

const compressJson = async (json: string) => {
  const jsonBytes = textEncoder.encode(json);
  const compressed = await deflate(jsonBytes);
  const arrBuf = compressed.buffer.slice(
    compressed.byteOffset,
    compressed.byteOffset + compressed.byteLength,
  ) as ArrayBuffer;
  const base64DeflatedJson = JSON.stringify(base64.encode(arrBuf));
  return base64DeflatedJson;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const copyFileToSrc = async (src: string) => {
  const fileName = basename(src);
  const dest = dirname(dirname(__dirname)) + "/src/" + fileName;
  await (fs.copyFile as any)(src, dest);
};

const main = async () => {
  const parent = dirname(dirname(__dirname));

  const fontNames = ["symbol", "zapfdingbats", "win1252"] as const;
  const allEncodings: Record<(typeof fontNames)[number], EncodingMap> = {
    symbol: {},
    zapfdingbats: {},
    win1252: {},
  };

  for (const fontName of fontNames) {
    const file = `${parent}/encoding-metrics/${fontName}.txt`;
    console.log("Parsing:", file);
    const data = await fs.readFile(file);

    const parser: (input: string) => EncodingMap =
      fontName === "win1252" ? parseWin1252 : parseZapfDingbatsOrSymbol;
    const jsonMetrics = parser(String(data));
    allEncodings[fontName] = jsonMetrics;

    const json = JSON.stringify(jsonMetrics);

    const jsonFile = `${parent}/encoding-metrics/${fontName}-encoding.json`;
    await fs.writeFile(jsonFile, json);
  }

  const allJson = JSON.stringify(allEncodings);
  const allCompressedJson = await compressJson(allJson);

  const allJsonFile = `${parent}/encoding-metrics/all-encodings.json`;
  const allCompressedJsonFile = `${parent}/encoding-metrics/all-encodings.compressed.json`;

  await fs.writeFile(allJsonFile, allJson);
  await fs.writeFile(allCompressedJsonFile, allCompressedJson);
  await copyFileToSrc(allCompressedJsonFile);
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
