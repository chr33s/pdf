export const HEAPU8: Uint8Array;
export function _encodeWithDictionary(
  quality: number,
  lgwin: number,
  mode: number,
  inputLength: number,
  inputPtr: number,
  dictionaryLength: number,
  dictionaryPtr: number,
  inputSize: number,
  outputPtr: number,
): number;
export function _malloc(size: number): number;
export function _free(ptr: number): void;
export default function MainModuleFactory(
  options?: unknown,
): Promise<MainModule>;
