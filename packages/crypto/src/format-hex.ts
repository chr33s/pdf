/**
 * Hex formatter for cipher params.
 */
import { CipherParams, type CipherFormat } from "./cipher-core.js";
import { Hex } from "./core.js";

/**
 * Hex formatter for cipher params.
 */
export const HexFormatter: CipherFormat = {
  /**
   * Converts the ciphertext of a cipher params object to a hexadecimally encoded string.
   *
   * @param cipherParams The cipher params object.
   *
   * @returns The hexadecimally encoded string.
   *
   * @example
   *
   *     const hexString = HexFormatter.stringify(cipherParams);
   */
  stringify(cipherParams: CipherParams): string {
    return cipherParams.ciphertext!.toString(Hex);
  },

  /**
   * Converts a hexadecimally encoded ciphertext string to a cipher params object.
   *
   * @param input The hexadecimally encoded string.
   *
   * @returns The cipher params object.
   *
   * @example
   *
   *     const cipherParams = HexFormatter.parse(hexString);
   */
  parse(input: string): CipherParams {
    const ciphertext = Hex.parse(input);
    return new CipherParams({ ciphertext });
  },
};
