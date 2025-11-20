import * as base64 from "base64-arraybuffer";
import fs from "mz/fs.js";
import pako from "pako";
import { basename, dirname } from "path";
import { fileURLToPath } from "url";

import { parseWin1252 } from "./parseWin1252.ts";
import { parseZapfDingbatsOrSymbol } from "./parseZapfDingbatsOrSymbol.ts";

const compressJson = (json: string) => {
  const jsonBytes = json.split("").map((c) => c.charCodeAt(0));
  const base64DeflatedJson = JSON.stringify(
    base64.encode(pako.deflate(jsonBytes)),
  );
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

  const allEncodings = {};
  for (const fontName of ["symbol", "zapfdingbats", "win1252"]) {
    const file = `${parent}/encoding_metrics/${fontName}.txt`;
    console.log("Parsing:", file);
    const data = await fs.readFile(file);

    const parser =
      fontName === "win1252" ? parseWin1252 : parseZapfDingbatsOrSymbol;
    const jsonMetrics = parser(String(data));
    allEncodings[fontName] = jsonMetrics;

    const json = JSON.stringify(jsonMetrics);

    const jsonFile = `${parent}/encoding_metrics/${fontName}-encoding.json`;
    await fs.writeFile(jsonFile, json);
  }

  const allJson = JSON.stringify(allEncodings);
  const allCompressedJson = compressJson(allJson);

  const allJsonFile = `${parent}/encoding_metrics/all-encodings.json`;
  const allCompressedJsonFile = `${parent}/encoding_metrics/all-encodings.compressed.json`;

  await fs.writeFile(allJsonFile, allJson);
  await fs.writeFile(allCompressedJsonFile, allCompressedJson);
  await copyFileToSrc(allCompressedJsonFile);
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
