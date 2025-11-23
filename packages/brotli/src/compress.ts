import brotliPromise from "./brotli.js";

const brotliModule = await brotliPromise();

type CompressOptions = {
  quality?: number;
  mode?: number;
  lgwin?: number;
  dictionary?: Uint8Array;
};

const DEFAULT_PADDING = 1024;

/**
 * Compresses the given buffer
 * The second parameter is optional and specifies whether the buffer is
 * text or binary data (the default is binary).
 * Returns null on error
 */
export const compress = function (
  buffer: Uint8Array,
  opts?: CompressOptions | boolean,
): Uint8Array | null {
  const brotli = brotliModule as any;
  // default to binary data
  let quality = 11;
  let mode = 0;
  let lgwin = 22;
  let dictionary = new Uint8Array();

  if (typeof opts === "boolean") {
    mode = opts ? 0 : 1;
  } else if (opts && typeof opts === "object") {
    quality = opts.quality ?? 11;
    mode = opts.mode ?? 0;
    lgwin = opts.lgwin ?? 22;
    if (opts.dictionary) {
      dictionary = new Uint8Array(opts.dictionary);
    }
  }

  // allocate input buffer and copy data to it
  const inputPtr = brotli._malloc(buffer.length);
  brotli.HEAPU8.set(buffer, inputPtr);

  // allocate dictionary buffer and copy data to it when provided
  let dictPtr = 0;
  if (dictionary.length > 0) {
    dictPtr = brotli._malloc(dictionary.length);
    brotli.HEAPU8.set(dictionary, dictPtr);
  }
  // allocate output buffer (same size + some padding to be sure it fits), and encode
  const encodedBufferSize = buffer.length + DEFAULT_PADDING;
  const outputPtr = brotli._malloc(encodedBufferSize);
  const encodedSize = brotli._encodeWithDictionary(
    quality,
    lgwin,
    mode,
    buffer.length,
    inputPtr,
    dictionary.length,
    dictPtr,
    encodedBufferSize,
    outputPtr,
  );

  let outBuffer: Uint8Array | null = null;
  if (encodedSize > 0) {
    // allocate and copy data to an output buffer
    outBuffer = new Uint8Array(encodedSize);
    outBuffer.set(brotli.HEAPU8.subarray(outputPtr, outputPtr + encodedSize));
  }

  // free malloc'd buffers
  brotli._free(inputPtr);
  brotli._free(outputPtr);
  if (dictPtr !== 0) {
    brotli._free(dictPtr);
  }

  return outBuffer;
};
