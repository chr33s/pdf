import initBrotli, {
  HEAPU8,
  _encodeWithDictionary,
  _free,
  _malloc,
} from "./encode.js";

const encoder = new TextEncoder();
await initBrotli();

export type BrotliCompressInput =
  | (ArrayLike<number> & { length: number })
  | string;

export interface BrotliCompressOptions {
  quality?: number;
  mode?: number;
  lgwin?: number;
  dictionary?: string | ArrayLike<number>;
}

/**
 * Compresses the given buffer.
 * The second parameter is optional and specifies whether the buffer is
 * text or binary data (the default is binary). Returns null on error.
 */
export function compress(
  buffer: BrotliCompressInput,
  opts?: BrotliCompressOptions | boolean,
) {
  let quality = 11;
  let mode = 0;
  let lgwin = 22;
  let dictionary: string | ArrayLike<number> | undefined;

  if (typeof opts === "boolean") {
    mode = opts ? 0 : 1;
  } else if (typeof opts === "object" && opts) {
    quality = opts.quality ?? quality;
    mode = opts.mode ?? mode;
    lgwin = opts.lgwin ?? lgwin;
    dictionary = opts.dictionary;
  }

  const inputBytes =
    typeof buffer === "string"
      ? encoder.encode(buffer)
      : buffer instanceof Uint8Array
        ? buffer
        : Uint8Array.from(buffer);
  const buf = _malloc(inputBytes.length);
  HEAPU8.set(inputBytes, buf);

  // allocate dictionary buffer and copy data to it
  const dictionaryBytes = (() => {
    if (!dictionary) return new Uint8Array(0);
    if (typeof dictionary === "string") {
      return encoder.encode(dictionary);
    }
    return dictionary instanceof Uint8Array
      ? dictionary
      : Uint8Array.from(dictionary);
  })();
  const dict = dictionaryBytes.length ? _malloc(dictionaryBytes.length) : 0;
  if (dictionaryBytes.length) {
    HEAPU8.set(dictionaryBytes, dict);
  }

  // allocate output buffer (same size + some padding to be sure it fits), and encode
  const outBuf = _malloc(inputBytes.length + 1024);
  const encodedSize = _encodeWithDictionary(
    quality,
    lgwin,
    mode,
    inputBytes.length,
    buf,
    dictionaryBytes.length,
    dict,
    inputBytes.length + 1024,
    outBuf,
  );

  let outBuffer: Uint8Array | null = null;
  if (encodedSize !== -1) {
    // allocate and copy data to an output buffer
    outBuffer = new Uint8Array(encodedSize);
    outBuffer.set(HEAPU8.subarray(outBuf, outBuf + encodedSize));
  }

  _free(buf);
  if (dict) {
    _free(dict);
  }
  _free(outBuf);

  return outBuffer;
}

export default compress;
