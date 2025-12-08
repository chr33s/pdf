/** Block cipher mode of operation. */
export interface Mode {
  name: string;
}

/** Cipher Block Chaining mode. */
export const CBC: Mode = {
  name: "CBC",
};

/** Electronic Codebook mode. */
export const ECB: Mode = {
  name: "ECB",
};
