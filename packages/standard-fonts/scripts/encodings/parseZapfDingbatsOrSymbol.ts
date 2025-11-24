import type { EncodingMap } from "./parseWin1252.ts";

export const parseZapfDingbatsOrSymbol = (data: string): EncodingMap => {
  const rows = data
    .split("\n")
    .filter((line) => line[0] !== "#")
    .filter(Boolean)
    .map((line) => line.split("\t"))
    .map(([unicodeCode, postscriptCode, unicodeName, postscriptName]) => [
      Number(`0x${unicodeCode}`),
      Number(`0x${postscriptCode}`),
      unicodeName.substring(2),
      postscriptName.substring(2).replace(" (CUS)", ""),
    ]) as Array<[number, number, string, string]>;

  const encodings: EncodingMap = {};
  for (const [unicodeCode, postscriptCode, , postscriptName] of rows) {
    encodings[unicodeCode] = [postscriptCode, postscriptName];
  }

  return encodings;
};
