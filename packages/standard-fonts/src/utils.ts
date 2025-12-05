import { decodeFromBase64 } from "@chr33s/pdf-base64";
import { inflate } from "@chr33s/pdf-compression";

const arrayToString = (array: Uint8Array) => {
  let str = "";
  for (let i = 0; i < array.length; i++) {
    str += String.fromCharCode(array[i]);
  }
  return str;
};

export const decompressJson = async (compressedJson: string): Promise<string> =>
  arrayToString(await inflate(decodeFromBase64(compressedJson)));

export const padStart = (value: string, length: number, padChar: string) => {
  let padding = "";
  for (let idx = 0, len = length - value.length; idx < len; idx++) {
    padding += padChar;
  }
  return padding + value;
};
