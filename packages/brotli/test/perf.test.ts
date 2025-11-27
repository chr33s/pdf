import { performance } from "node:perf_hooks";
import { expect, test } from "vitest";

import { brotliDecode } from "../src/decode.js";
import { readFile } from "./utilts.js";

const data = await readFile("./test.data.br"); // brotli ./test.data
if (!Buffer.isBuffer(data)) throw "not a buffer";
const bytes = new Int8Array(data);

function runOperation(repeat = 10, iterations = 10): number {
  const start = performance.now();

  for (let i = 0; i < iterations; ++i) {
    const a = performance.now();
    let result: Int8Array<ArrayBufferLike> = new Int8Array();
    for (let j = 0; j < repeat; ++j) {
      result = brotliDecode(bytes);
    }
    const b = performance.now();
    const _total_length = (repeat * result.length) / (1024 * 1024);
    const _total_time = (b - a) / 1000;
  }

  const end = performance.now();
  return end - start;
}

test("performance", () => {
  const timeTaken = runOperation();
  expect(timeTaken).toBeLessThan(1_000);
});
