/* Copyright 2023 Google Inc. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/
import { describe, expect, test } from "vitest";

import { brotliDecode } from "../src/decode.js";
import { readFile, readdir } from "./utilts.js";

const compressedFiles = (await readdir("data")).filter((file) => file.endsWith(".compressed"));

describe("bundle", () => {
  test.each(compressedFiles)(`%s`, async (file) => {
    const compressed = await readFile(`data/${file}`);
    const expected = await readFile(`data/${file.replace(/\.compressed$/, "")}`);
    const result = brotliDecode(new Int8Array(compressed));
    expect(Buffer.from(result!)).toStrictEqual(expected);
  });
});
