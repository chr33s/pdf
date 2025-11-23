import fs from "node:fs";
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

export function readFileSync(path: string): Uint8Array<ArrayBufferLike>;
export function readFileSync(path: string, encoding: BufferEncoding): string;
export function readFileSync(
  path: string,
  encoding?: BufferEncoding,
): Uint8Array<ArrayBufferLike> | string {
  return fs.readFileSync(resolve(__dirname, path), encoding);
}

export const readdirSync = (path: string) =>
  fs.readdirSync(resolve(__dirname, path));
