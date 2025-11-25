import { readdir as fsReaddir, readFile as fsReadFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export const normalize = (buffer: Uint8Array<ArrayBufferLike>) => {
  const input = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (!input.includes(0x0d)) return input;

  const output = Buffer.allocUnsafe(input.length);
  let writeIndex = 0;

  for (let readIndex = 0; readIndex < input.length; readIndex += 1) {
    const byte = input[readIndex];

    if (byte === 0x0d && input[readIndex + 1] === 0x0a) {
      output[writeIndex] = 0x0a;
      writeIndex += 1;
      readIndex += 1;
      continue;
    }

    output[writeIndex] = byte;
    writeIndex += 1;
  }

  return output.subarray(0, writeIndex);
};

export function readFile(path: string): Promise<Buffer>;
export function readFile(
  path: string,
  encoding: BufferEncoding,
): Promise<string>;
export function readFile(
  path: string,
  encoding?: BufferEncoding,
): Promise<Buffer | string> {
  return fsReadFile(resolve(__dirname, path), encoding);
}

export const readdir = (path: string): Promise<string[]> =>
  fsReaddir(resolve(__dirname, path));
