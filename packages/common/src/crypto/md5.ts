import { createHash } from "node:crypto";
import { WordArray } from "./word-array.js";

/** Computes MD5 hash of a message. */
export function MD5(message: WordArray | string): WordArray {
  const data = typeof message === "string" ? message : message.toUint8Array();
  const hash = createHash("md5").update(data).digest();
  return WordArray.fromUint8Array(hash);
}

export default MD5;
