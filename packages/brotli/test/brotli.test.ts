import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import decompress from "../src/decompress.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const resolvePath = (p: string) => path.join(rootDir, p);
const readFileSync = (p: string, o?: any) => fs.readFileSync(resolvePath(p), o);

import compress from "../src/compress.js";
import * as brotli from "../src/index.js";

describe("compress", () => {
  it("compresses binary data through the aggregated entry point", async () => {
    const data = readFileSync("dist/encode.js").subarray(0, 1024 * 4);
    const res = brotli.compress(data);
    expect(res).not.toBeNull();
    expect(res!.length).toBeLessThan(data.length);
  });

  it("compresses binary data through the direct helper", async () => {
    const data = readFileSync("dist/encode.js").subarray(0, 1024 * 4);
    const res = compress(data);
    expect(res).not.toBeNull();
    expect(res!.length).toBeLessThan(data.length);
  });

  it("compresses text data through the aggregated entry point", async () => {
    const data = readFileSync("dist/encode.js", "utf8").slice(0, 1024 * 4);
    const res = brotli.compress(data, true);
    expect(res).not.toBeNull();
    expect(res!.length).toBeLessThan(data.length);
  }, 100000);

  it("compresses text data through the direct helper", async () => {
    const data = fs.readFileSync("dist/encode.js", "utf8").slice(0, 1024 * 4);
    const res = compress(data, true);
    expect(res).not.toBeNull();
    expect(res!.length).toBeLessThan(data.length);
  }, 100000);

  it("compress some text with a dictionary", function () {
    const dictionary = readFileSync("test/testdata/alice29.txt");
    const data = readFileSync("test/testdata/alice30.txt");
    const res = compress(data, { dictionary });
    const diff = readFileSync("test/testdata/alice30_diff_from_29.txt.sbr");
    expect(res!.length == diff.length).toBe(true);
    // The first char of the output is different between our function and the CLI version.
    // It presumably represents the window size difference when encoding. It has no impact
    // on decoding outcomes.
    expect(res!.subarray(1)).toEqual(diff.subarray(1));
  });

  it("should compress short data", function () {
    const res = compress(Buffer.from([255, 255, 255]));
    expect(res!.length > 3).toBe(true);
  });
});

describe("decompress", () => {
  const dataDir = path.join(__dirname, "testdata");
  const cases = fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith(".compressed"));

  cases.forEach((file) => {
    it(file, () => {
      const compressed = fs.readFileSync(path.join(dataDir, file));
      const expected = fs.readFileSync(
        path.join(dataDir, file.replace(/\.compressed.*/, "")),
      );
      const result = decompress(compressed, null);
      expect(Buffer.from(result!)).toStrictEqual(expected);
    });
  });
});

describe("roundtrip", () => {
  const files = ["alice29.txt", "asyoulik.txt", "lcet10.txt", "plrabn12.txt"];
  const dataDir = path.join(__dirname, "testdata");

  files.forEach((file) => {
    it(file, async () => {
      const input = fs.readFileSync(path.join(dataDir, file));
      const compressed = compress(input)!;
      const decompressed = decompress(compressed, null);
      expect(Buffer.from(decompressed!)).toStrictEqual(input);
    }, 10000);
  });
});
