import fs from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const readFile = (path: string) => fs.readFile(resolve(__dirname, path));

export const readdir = (path: string) => fs.readdir(resolve(__dirname, path));
