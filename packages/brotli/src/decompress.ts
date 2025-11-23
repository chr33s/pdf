import brotliPromise from "./brotli.js";

/**
 * Compresses the given buffer
 * The second parameter is optional and specifies whether the buffer is
 * text or binary data (the default is binary).
 * Returns null on error
 */
type DecompressOptions = {
  dictionary?: Uint8Array;
};

export const decompress = async function (
  buffer: Uint8Array,
  opts?: DecompressOptions,
): Promise<Uint8Array | null> {
  const brotli = (await brotliPromise()) as any;
  // allocate input buffer and copy data to it
  const inputPtr = brotli._malloc(buffer.length);
  brotli.HEAPU8.set(buffer, inputPtr);

  let dictPtr = 0;
  let dictionaryLength = 0;
  if (opts?.dictionary) {
    dictionaryLength = opts.dictionary.length;
    if (dictionaryLength > 0) {
      dictPtr = brotli._malloc(dictionaryLength);
      brotli.HEAPU8.set(opts.dictionary, dictPtr);
    }
  }

  // allocate output buffer size marker and request decompression from wasm
  const decodedSizePtr = brotli._malloc(Int32Array.BYTES_PER_ELEMENT);
  const outputPtr = brotli._decompress(
    buffer.length,
    inputPtr,
    dictionaryLength,
    dictPtr,
    decodedSizePtr,
  );
  const decodedSize = brotli.getValue(decodedSizePtr, "i32");

  let outBuffer: Uint8Array | null = null;
  if (outputPtr !== 0 && decodedSize >= 0) {
    // allocate and copy data to an output buffer
    outBuffer = new Uint8Array(decodedSize);
    outBuffer.set(brotli.HEAPU8.subarray(outputPtr, outputPtr + decodedSize));
  }

  // free malloc'd buffers
  brotli._free(inputPtr);
  if (outputPtr !== 0) {
    brotli._free(outputPtr);
  }
  if (dictPtr !== 0) {
    brotli._free(dictPtr);
  }
  brotli._free(decodedSizePtr);

  return outBuffer;
};
