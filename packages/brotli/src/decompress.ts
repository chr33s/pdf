import { BrotliDecompressBuffer } from "./dec/decode.js";

const decompress: typeof BrotliDecompressBuffer = BrotliDecompressBuffer;
export { decompress };
export default decompress;
