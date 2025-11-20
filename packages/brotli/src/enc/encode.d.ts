export interface BrotliEncodeModule {
  HEAPU8: Uint8Array;
  _malloc(size: number): number;
  _free(ptr: number): void;
  _encode(
    quality: number,
    lgwin: number,
    mode: number,
    inputLength: number,
    inputPtr: number,
    inputSize: number,
    outputPtr: number,
  ): number;
}

declare const module: BrotliEncodeModule;
export default module;
