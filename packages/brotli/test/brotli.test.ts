import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import decompress from "../src/decompress.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const buildEncodePath = path.join(rootDir, "build/encode.js");
const hasEncodeArtifact = fs.existsSync(buildEncodePath);

const describeCompress = hasEncodeArtifact ? describe : describe.skip;

const loadBrotli = async () => await import("../src/index.js");
const loadCompress = async () => (await import("../src/compress.js")).default;

describeCompress("compress", () => {
  it("compresses binary data through the aggregated entry point", async () => {
    const data = fs.readFileSync(buildEncodePath).subarray(0, 1024 * 4);
    const brotli = await loadBrotli();
    const res = brotli.compress(data);
    expect(res).not.toBeNull();
    expect(res!.length).toBeLessThan(data.length);
  });

  it("compresses binary data through the direct helper", async () => {
    const data = fs.readFileSync(buildEncodePath).subarray(0, 1024 * 4);
    const compress = await loadCompress();
    const res = compress(data);
    expect(res).not.toBeNull();
    expect(res!.length).toBeLessThan(data.length);
  });

  it("compresses text data through the aggregated entry point", async () => {
    const data = fs.readFileSync(buildEncodePath, "utf8").slice(0, 1024 * 4);
    const brotli = await loadBrotli();
    const res = brotli.compress(data, true);
    expect(res).not.toBeNull();
    expect(res!.length).toBeLessThan(data.length);
  }, 100000);

  it("compresses text data through the direct helper", async () => {
    const data = fs.readFileSync(buildEncodePath, "utf8").slice(0, 1024 * 4);
    const compress = await loadCompress();
    const res = compress(data, true);
    expect(res).not.toBeNull();
    expect(res!.length).toBeLessThan(data.length);
  }, 100000);
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

const describeRoundtrip = hasEncodeArtifact ? describe : describe.skip;

describeRoundtrip("roundtrip", () => {
  const files = ["alice29.txt", "asyoulik.txt", "lcet10.txt", "plrabn12.txt"];
  const dataDir = path.join(__dirname, "testdata");

  files.forEach((file) => {
    it(file, async () => {
      const input = fs.readFileSync(path.join(dataDir, file));
      const compress = await loadCompress();
      const compressed = compress(input)!;
      const decompressed = decompress(compressed, null);
      expect(Buffer.from(decompressed!)).toStrictEqual(input);
    }, 10000);
  });
});
