import { decompressJson, padStart } from "./utils.js";

import AllEncodingsCompressed from "./all-encodings.compressed.json" with { type: "json" };

type EncodingCharCode = number;
type EncodingCharName = string;
interface UnicodeMappings {
  [unicodeCodePoint: number]: [EncodingCharCode, EncodingCharName];
}

let allUnicodeMappings: {
  symbol: UnicodeMappings;
  zapfdingbats: UnicodeMappings;
  win1252: UnicodeMappings;
} | null = null;

const getAllUnicodeMappings = async () => {
  if (allUnicodeMappings) return allUnicodeMappings;
  const decompressedEncodings = await decompressJson(AllEncodingsCompressed);
  allUnicodeMappings = JSON.parse(decompressedEncodings);
  return allUnicodeMappings;
};

type EncodingNames = "Symbol" | "ZapfDingbats" | "WinAnsi";

class Encoding {
  name: EncodingNames;
  supportedCodePoints: number[] = [];
  #unicodeMappings: UnicodeMappings = {};

  private constructor(name: EncodingNames) {
    this.name = name;
  }

  static async create(name: EncodingNames, unicodeMappings: UnicodeMappings): Promise<Encoding> {
    const encoding = new Encoding(name);
    encoding.supportedCodePoints = Object.keys(unicodeMappings)
      .map(Number)
      .sort((a, b) => a - b);
    encoding.#unicodeMappings = unicodeMappings;
    return encoding;
  }

  canEncodeUnicodeCodePoint = (codePoint: number) => codePoint in this.#unicodeMappings;

  encodeUnicodeCodePoint = (codePoint: number) => {
    const mapped = this.#unicodeMappings[codePoint];
    if (!mapped) {
      const str = String.fromCharCode(codePoint);
      const hexCode = `0x${padStart(codePoint.toString(16), 4, "0")}`;
      const msg = `${this.name} cannot encode "${str}" (${hexCode})`;
      throw new Error(msg);
    }
    return { code: mapped[0], name: mapped[1] };
  };
}

export type EncodingType = Encoding;

let encodingsCache: {
  Symbol: Encoding;
  ZapfDingbats: Encoding;
  WinAnsi: Encoding;
} | null = null;

export const getEncodings = async () => {
  if (encodingsCache) return encodingsCache;
  const mappings = await getAllUnicodeMappings();
  encodingsCache = {
    Symbol: await Encoding.create("Symbol", mappings!.symbol),
    ZapfDingbats: await Encoding.create("ZapfDingbats", mappings!.zapfdingbats),
    WinAnsi: await Encoding.create("WinAnsi", mappings!.win1252),
  };
  return encodingsCache;
};

/** @deprecated Use getEncodings() instead for async loading */
export const Encodings = {
  Symbol: null as unknown as Encoding,
  ZapfDingbats: null as unknown as Encoding,
  WinAnsi: null as unknown as Encoding,
};

// Initialize encodings asynchronously
void getEncodings().then((e) => Object.assign(Encodings, e));
