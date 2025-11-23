// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
declare namespace RuntimeExports {
  /**
   * @param {number} ptr
   * @param {string} type
   */
  function getValue(ptr: number, type?: string): any;
  /**
   * @param {number} ptr
   * @param {number} value
   * @param {string} type
   */
  function setValue(ptr: number, value: number, type?: string): void;
  function writeArrayToMemory(array: any, buffer: any): void;
  let HEAP8: any;
  let HEAPU8: any;
}
interface WasmModule {
  _encodeWithDictionary(
    _0: number,
    _1: number,
    _2: number,
    _3: number,
    _4: number,
    _5: number,
    _6: number,
    _7: number,
    _8: number,
  ): number;
  _free(_0: number): void;
  _decompress(
    _0: number,
    _1: number,
    _2: number,
    _3: number,
    _4: number,
  ): number;
  _malloc(_0: number): number;
}

export type MainModule = WasmModule & typeof RuntimeExports;
export default function MainModuleFactory(
  options?: unknown,
): Promise<MainModule>;
