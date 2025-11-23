import fs from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

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
