import codePoints from "../src/index.ts";

for (const codePoint of codePoints) {
  if (codePoint) {
    console.log(JSON.stringify(codePoint));
  }
}
