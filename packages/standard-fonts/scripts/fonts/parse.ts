import * as base64 from 'base64-arraybuffer';
import fs from 'mz/fs';
import pako from 'pako';
import { basename, dirname } from 'path';

import { ICharMetrics, parseCharMetricsSection } from './parseCharacterMetrics';
import { IFontMetrics, parseFontMetricsSection } from './parseFontMetrics';
import { IKernPair, parseKernPairsSection } from './parseKernPairs';

interface IMetrics extends IFontMetrics {
  CharMetrics: ICharMetrics[];
  KernPairs: IKernPair[];
}

export { IMetrics };

export const parseFontMetrics = (data: string): IMetrics => ({
  ...parseFontMetricsSection(data),
  CharMetrics: parseCharMetricsSection(data),
  KernPairs: parseKernPairsSection(data),
});

const getAfmFilePaths = async () => {
  const parentDir = dirname(dirname(__dirname));
  const files = await fs.readdir(`${parentDir}/font_metrics`);
  const afmFiles = files.filter((name) => name.includes('.afm'));
  return afmFiles.map((name) => `${parentDir}/font_metrics/${name}`);
};

const compressJson = (json: string) => {
  const jsonBytes = json.split('').map((c) => c.charCodeAt(0));
  const base64DeflatedJson = JSON.stringify(
    base64.encode(pako.deflate(jsonBytes)),
  );
  return base64DeflatedJson;
};

const copyFileToSrc = async (src: string) => {
  const fileName = basename(src);
  const dest = dirname(dirname(__dirname)) + '/src/' + fileName;
  await (fs.copyFile as any)(src, dest);
};

const main = async () => {
  const afmFiles = await getAfmFilePaths();

  for (const afmFile of afmFiles) {
    console.log('Parsing:', afmFile);
    const data = await fs.readFile(afmFile);

    const metrics = parseFontMetrics(String(data));
    const jsonMetrics = JSON.stringify(metrics);

    const jsonFile = afmFile.replace('.afm', '.json');
    const compressedJsonFile = afmFile.replace('.afm', '.compressed.json');

    await fs.writeFile(jsonFile, jsonMetrics);
    await fs.writeFile(compressedJsonFile, compressJson(jsonMetrics));
    await copyFileToSrc(compressedJsonFile);
  }
};

main();
