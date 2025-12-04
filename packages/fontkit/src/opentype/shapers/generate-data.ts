//
// This script generates a UnicodeTrie containing shaping data derived
// from Unicode properties (currently just for the Arabic shaper).
//
import * as base64 from "@chr33s/base64";
import codepoints from "@chr33s/codepoints";
import { deflate } from "@chr33s/compression";
import { builder as UnicodeTrieBuilder } from "@chr33s/unicode-trie";
import fs from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const toArrayBuffer = (view: Uint8Array): ArrayBuffer =>
  view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;

const ShapingClasses = {
  Non_Joining: 0,
  Left_Joining: 1,
  Right_Joining: 2,
  Dual_Joining: 3,
  Join_Causing: 3,
  ALAPH: 4,
  "DALATH RISH": 5,
  Transparent: 6,
} as const;

type ShapingClassKey = keyof typeof ShapingClasses;

let trie = new UnicodeTrieBuilder();
for (let i = 0; i < codepoints.length; i++) {
  let codepoint = codepoints[i];
  if (codepoint) {
    if (codepoint.joiningGroup === "ALAPH" || codepoint.joiningGroup === "DALATH RISH") {
      const group = codepoint.joiningGroup as ShapingClassKey;
      trie.set(codepoint.code, ShapingClasses[group] + 1);
    } else if (codepoint.joiningType && codepoint.joiningType in ShapingClasses) {
      const type = codepoint.joiningType as ShapingClassKey;
      trie.set(codepoint.code, ShapingClasses[type] + 1);
    }
  }
}

// Trie is serialized suboptimally as JSON so it can be loaded via require,
// allowing unicode-properties to work in the browser
const filePath = join(__dirname, "trie.json");
const compressedTrie = await deflate(await trie.toBuffer());
const jsonBase64DeflatedTrie = JSON.stringify(base64.encode(toArrayBuffer(compressedTrie)));
await fs.writeFile(filePath, jsonBase64DeflatedTrie);

const modulePath = join(__dirname, "trie-data.js");
await fs.writeFile(modulePath, `export default ${jsonBase64DeflatedTrie};\n`);
