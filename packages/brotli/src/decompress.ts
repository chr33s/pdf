import { BrotliDecompressBuffer } from "./dec/decode.js";

const decompress: typeof BrotliDecompressBuffer = BrotliDecompressBuffer;

export { BrotliDecompressBuffer, decompress };
export default decompress;
