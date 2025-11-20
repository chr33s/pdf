import brotli from "./enc/encode.js";

export type BrotliCompressInput = ArrayLike<number> & { length: number };

export interface BrotliCompressOptions {
  quality?: number;
  mode?: number;
  lgwin?: number;
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

  if (typeof opts === "boolean") {
    mode = opts ? 0 : 1;
  } else if (typeof opts === "object" && opts) {
    quality = opts.quality ?? quality;
    mode = opts.mode ?? mode;
    lgwin = opts.lgwin ?? lgwin;
  }

  const buf = brotli._malloc(buffer.length);
  brotli.HEAPU8.set(buffer as ArrayLike<number>, buf);

  const outBuf = brotli._malloc(buffer.length + 1024);
  const encodedSize = brotli._encode(
    quality,
    lgwin,
    mode,
    buffer.length,
    buf,
    buffer.length,
    outBuf,
  );

  let outBuffer: Uint8Array | null = null;
  if (encodedSize !== -1) {
    outBuffer = new Uint8Array(encodedSize);
    outBuffer.set(brotli.HEAPU8.subarray(outBuf, outBuf + encodedSize));
  }

  brotli._free(buf);
  brotli._free(outBuf);

  return outBuffer;
}

export default compress;
