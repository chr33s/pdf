/**
 * Compression utilities using web CompressionStream and DecompressionStream APIs.
 * Provides both deflate (compression) and inflate (decompression) functions.
 *
 * Note: These APIs work with zlib-wrapped deflate format by default.
 * For raw deflate (no zlib header), use the 'deflate-raw' format.
 */

export type CompressionFormat = "deflate" | "deflate-raw" | "gzip";

/**
 * Concatenate multiple Uint8Arrays into a single Uint8Array
 */
const concatUint8Arrays = (arrays: Uint8Array[]): Uint8Array => {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
};

/**
 * Read all chunks from a ReadableStream and concatenate them
 */
const readAllChunks = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return concatUint8Arrays(chunks);
};

/**
 * Compress data using the specified format (async)
 */
export const deflate = async (
  data: Uint8Array,
  format: CompressionFormat = "deflate",
): Promise<Uint8Array> => {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream(format));
  return readAllChunks(stream);
};

/**
 * Decompress data using the specified format (async)
 */
export const inflate = async (
  data: Uint8Array,
  format: CompressionFormat = "deflate",
): Promise<Uint8Array> => {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream(format));
  return readAllChunks(stream);
};

/**
 * Compress data using raw deflate format (no zlib header) (async)
 */
export const deflateRaw = async (data: Uint8Array): Promise<Uint8Array> => {
  return deflate(data, "deflate-raw");
};

/**
 * Decompress data using raw deflate format (no zlib header) (async)
 */
export const inflateRaw = async (data: Uint8Array): Promise<Uint8Array> => {
  return inflate(data, "deflate-raw");
};

/**
 * Compress data using gzip format (async)
 */
export const gzip = async (data: Uint8Array): Promise<Uint8Array> => {
  return deflate(data, "gzip");
};

/**
 * Decompress data using gzip format (async)
 */
export const gunzip = async (data: Uint8Array): Promise<Uint8Array> => {
  return inflate(data, "gzip");
};
