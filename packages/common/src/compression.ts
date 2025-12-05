import type { FlateError } from "fflate";
import {
  deflateSync as fflateDeflateSync,
  gunzip as fflateGunzip,
  gzip as fflateGzip,
  inflateSync as fflateInflateSync,
  unzlibSync as fflateUnzlibSync,
  zlibSync as fflateZlibSync,
} from "fflate";

export type CompressionFormat = "deflate" | "deflate-raw" | "gzip";

export const deflate = async (
  data: Uint8Array,
  format: CompressionFormat = "deflate",
): Promise<Uint8Array> => {
  switch (format) {
    case "deflate":
      return fflateZlibSync(data);
    case "deflate-raw":
      return fflateDeflateSync(data);
    case "gzip":
      return new Promise((resolve, reject) => {
        fflateGzip(data, (err: FlateError | null, result: Uint8Array) =>
          err ? reject(err) : resolve(result),
        );
      });
  }
};

export const inflate = async (
  data: Uint8Array,
  format: CompressionFormat = "deflate",
): Promise<Uint8Array> => {
  switch (format) {
    case "deflate":
      return fflateUnzlibSync(data);
    case "deflate-raw":
      return fflateInflateSync(data);
    case "gzip":
      return new Promise((resolve, reject) => {
        fflateGunzip(data, (err: FlateError | null, result: Uint8Array) =>
          err ? reject(err) : resolve(result),
        );
      });
  }
};

export const deflateRaw = async (data: Uint8Array): Promise<Uint8Array> => fflateDeflateSync(data);

export const inflateRaw = async (data: Uint8Array): Promise<Uint8Array> => fflateInflateSync(data);

export const gzip = async (data: Uint8Array): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    fflateGzip(data, (err: FlateError | null, result: Uint8Array) =>
      err ? reject(err) : resolve(result),
    );
  });

export const gunzip = async (data: Uint8Array): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    fflateGunzip(data, (err: FlateError | null, result: Uint8Array) =>
      err ? reject(err) : resolve(result),
    );
  });
