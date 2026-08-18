export type CompressionFormat = "deflate" | "deflate-raw" | "gzip";

function concatUint8Arrays(arrays: Uint8Array[]) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

async function readAllChunks(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return concatUint8Arrays(chunks);
}

/**
 * Compresses data using the specified compression format.
 * @param data The data to compress
 * @param format Compression format: 'deflate' (default), 'deflate-raw', or 'gzip'
 */
export async function deflate(data: Uint8Array, format: CompressionFormat = "deflate") {
  const stream = new Blob([data as Uint8Array<ArrayBuffer>])
    .stream()
    .pipeThrough(new CompressionStream(format));
  return readAllChunks(stream);
}

/**
 * Decompresses data using the specified compression format.
 * @param data The compressed data
 * @param format Compression format: 'deflate' (default), 'deflate-raw', or 'gzip'
 */
export async function inflate(data: Uint8Array, format: CompressionFormat = "deflate") {
  const stream = new Blob([data as Uint8Array<ArrayBuffer>])
    .stream()
    .pipeThrough(new DecompressionStream(format));
  return readAllChunks(stream);
}
