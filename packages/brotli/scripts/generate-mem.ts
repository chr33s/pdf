#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { brotliCompressSync, constants } from "zlib";

function fail(message: string) {
  console.error(message);
  process.exit(1);
}

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  fail("Usage: generate-mem <input> <output>");
}

const resolvedInput = path.resolve(inputPath);
const resolvedOutput = path.resolve(outputPath);

if (!fs.existsSync(resolvedInput)) {
  fail(`Input file not found: ${resolvedInput}`);
}

const raw = fs.readFileSync(resolvedInput);
const compressed = brotliCompressSync(raw, {
  params: {
    [constants.BROTLI_PARAM_QUALITY]: 11,
  },
});
const base64 = compressed.toString("base64");
const moduleSource = `export default "${base64}";\n`;
fs.writeFileSync(resolvedOutput, moduleSource);
